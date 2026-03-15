import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const FEEDS = [
  // Spanish Sources
  { name: 'INCIBE', url: 'https://www.incibe.es/rss.xml', lang: 'ES' },
  { name: 'ESET Welch', url: 'https://www.welivesecurity.com/es/feed/', lang: 'ES' },
  { name: 'Hispasec', url: 'https://unaaldia.hispasec.com/feed', lang: 'ES' },
  // English Sources
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', lang: 'EN' },
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', lang: 'EN' },
  { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', lang: 'EN' }
];

function categorize(title: string): "breach" | "vulnerability" | "ransomware" | "general" {
  const t = title.toLowerCase();
  if (t.includes('breach') || t.includes('leak') || t.includes('filtración')) return 'breach';
  if (t.includes('vulnerability') || t.includes('cve') || t.includes('vulnerabilidad')) return 'vulnerability';
  if (t.includes('ransomware')) return 'ransomware';
  return 'general';
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, '').substring(0, 150).trim();
}

export async function GET() {
  try {
    const feedPromises = FEEDS.map(async (f) => {
      try {
        const feed = await parser.parseURL(f.url);
        return feed.items.map(item => ({
          title: item.title || 'No Title',
          description: stripHtml(item.contentSnippet || item.content || ''),
          source: f.name,
          url: item.link || '',
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          category: categorize(item.title || ''),
          lang: f.lang
        }));
      } catch (e) {
        console.error(`Error fetching feed ${f.name}:`, e);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const allArticles = results.flat();

    // Sort: Spanish articles first, then by date descending
    allArticles.sort((a, b) => {
      if (a.lang === 'ES' && b.lang !== 'ES') return -1;
      if (a.lang !== 'ES' && b.lang === 'ES') return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return NextResponse.json({
      articles: allArticles.slice(0, 20)
    });
  } catch (error) {
    return NextResponse.json({ articles: [], error: 'Failed to fetch news' }, { status: 500 });
  }
}
