import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000,
});

const FEEDS_ES = [
  { url: 'https://www.welivesecurity.com/es/feed/', source: 'ESET WeLiveSecurity', lang: 'es' },
  { url: 'https://unaaldia.hispasec.com/feed', source: 'Una al Día', lang: 'es' },
  { url: 'http://feeds.feedburner.com/NoticiasSeguridadInformatica', source: 'Segu-Info', lang: 'es' },
  { url: 'https://cybersecuritypulse.e-paths.com/es/feed', source: 'CyberSecurity Pulse', lang: 'es' },
  { url: 'https://www.ccn-cert.cni.es/component/obrss/rss-noticias.feed', source: 'CCN-CERT', lang: 'es' },
  { url: 'https://www.incibe.es/rss.xml', source: 'INCIBE', lang: 'es' }
];

const FEEDS_EN = [
  { url: 'https://feeds.feedburner.com/TheHackersNews', source: 'The Hacker News', lang: 'en' },
  { url: 'https://www.bleepingcomputer.com/feed/', source: 'BleepingComputer', lang: 'en' },
  { url: 'https://krebsonsecurity.com/category/data-breaches/feed/', source: 'Krebs on Security', lang: 'en' }
];

function cleanHtmlAndTruncate(html: string = '', maxLength: number = 120) {
  const text = html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

function getCategory(title: string) {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('filtración') || titleLower.includes('breach') || titleLower.includes('datos expuestos') || titleLower.includes('leak')) {
    return 'breach';
  }
  if (titleLower.includes('cve') || titleLower.includes('vulnerabilidad') || titleLower.includes('vulnerability') || titleLower.includes('exploit')) {
    return 'vulnerability';
  }
  if (titleLower.includes('ransomware')) {
    return 'ransomware';
  }
  return 'general';
}

export async function GET() {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const fetchFeed = async (feed: { url: string, source: string, lang: string }) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return parsed.items.map(item => ({
          title: item.title || '',
          description: cleanHtmlAndTruncate(item.contentSnippet || item.content || item.summary || ''),
          source: feed.source,
          url: item.link || '',
          publishedAt: item.isoDate || item.pubDate ? new Date((item.isoDate || item.pubDate) as string).toISOString() : new Date().toISOString(),
          lang: feed.lang as 'es' | 'en',
          category: getCategory(item.title || '')
        })).filter(item => {
          const pubDate = new Date(item.publishedAt);
          return !isNaN(pubDate.getTime()) && pubDate > twelveMonthsAgo;
        });
      } catch (error) {
        console.error(`Error fetching feed ${feed.url}:`, error);
        return [];
      }
    };

    const allFeeds = [...FEEDS_ES, ...FEEDS_EN];
    const results = await Promise.all(allFeeds.map(fetchFeed));
    
    // Flat array of all articles
    const articles = results.flat();

    // Separate by language for custom sorting
    const esArticles = articles.filter(a => a.lang === 'es').sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const enArticles = articles.filter(a => a.lang === 'en').sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Mix or just follow requirements: "primero español por fecha desc, luego inglés por fecha desc"
    const sortedArticles = [...esArticles, ...enArticles].slice(0, 24);

    return NextResponse.json({ articles: sortedArticles }, {
      headers: {
        'Cache-Control': 's-maxage=1200, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error("Error in security-news route:", error);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}
