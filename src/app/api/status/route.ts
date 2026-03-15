import { NextResponse } from 'next/server';

const PUBLIC_STATUS_PAGES = {
  github: 'https://www.githubstatus.com/api/v2/status.json',
  openai: 'https://status.openai.com/api/v2/status.json',
  discord: 'https://discordstatus.com/api/v2/status.json',
  anthropic: 'https://status.anthropic.com/api/v2/status.json',
  twitch: 'https://status.twitch.tv/api/v2/status.json',
  epic: 'https://status.epicgames.com/api/v2/status.json',
  vercel: 'https://www.vercel-status.com/api/v2/status.json',
  cloudflare: 'https://www.cloudflarestatus.com/api/v2/status.json',
  // New Atlassian Statuspage endpoints
  microsoft: 'https://azure.status.microsoft/api/v2/status.json',
  twitter: 'https://api.twitterstat.us/api/v2/status.json',
  battlenet: 'https://status.blizzard.com/api/v2/status.json',
};

async function getAtlassianStatus(url: string, serviceKey?: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();
    const indicator = data.status?.indicator || 'none';
    
    if (indicator === 'none') return 'online';

    // Manejo específico para Vercel: ignorar minor/maint, solo warning si es major o critical
    if (serviceKey === 'vercel') {
      if (indicator === 'major' || indicator === 'critical') return 'warning';
      return 'online';
    }

    if (indicator === 'minor' || indicator === 'maint' || indicator === 'major') return 'warning';
    if (indicator === 'critical') return 'offline';
    
    return 'online'; 
  } catch (e) {
    return 'online'; 
  }
}

async function getGoogleCloudStatus() {
  try {
    const res = await fetch('https://status.cloud.google.com/incidents.json', { next: { revalidate: 60 } });
    const incidents = await res.json();
    const active = incidents.filter((i: any) => {
      // Activos son aquellos que no han terminado o cuyo estado más reciente no es AVAILABLE
      return !i.end || (i.most_recent_update && i.most_recent_update.status !== 'AVAILABLE');
    });
    
    if (active.length === 0) return 'online';
    if (active.length > 0 && active.length <= 2) return 'warning';
    return 'warning'; // 3+ también es warning, no offline
  } catch (e) {
    return 'online';
  }
}

async function getSteamStatus() {
  try {
    const res = await fetch('https://steamstat.us/status.json', { next: { revalidate: 60 } });
    const data = await res.json();
    if (data.services?.steam?.status === 'normal') return 'online';
    return 'warning';
  } catch (e) {
    return 'online';
  }
}

async function getIsDownStatus(service: string) {
  try {
    const res = await fetch(
      `https://isdown.app/integrations/${service}.json`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    if (data.status === 'operational') return 'online';
    if (data.status === 'degraded' || data.status === 'disruption') return 'warning';
    if (data.status === 'outage') return 'offline';
    return 'online';
  } catch {
    return 'online';
  }
}

async function getPingStatus(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const start = Date.now();
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    if (!res.ok) return 'warning';
    if (latency > 3000) return 'warning';
    return 'online';
  } catch {
    return 'online'; 
  }
}

export async function GET() {
  const atlassianPromises = Object.entries(PUBLIC_STATUS_PAGES).map(async ([key, url]) => {
    const status = await getAtlassianStatus(url, key);
    return [key, status];
  });

  const [
    atlassianResults,
    googleStatus,
    steamStatus,
    metaStatus,
    awsStatus,
    starlinkStatus,
    flowStatus,
    personalStatus,
    claroStatus,
    movistarStatus,
  ] = await Promise.all([
    Promise.all(atlassianPromises),
    getGoogleCloudStatus(),
    getSteamStatus(),
    getIsDownStatus('meta'),
    getIsDownStatus('aws'),
    getPingStatus('https://www.starlink.com'),
    getPingStatus('https://www.personalflow.com.ar'),
    getPingStatus('https://www.personal.com.ar'),
    getPingStatus('https://www.claro.com.ar'),
    getPingStatus('https://www.movistar.com.ar'),
  ]);

  const statusMap: Record<string, string> = Object.fromEntries(atlassianResults);
  statusMap['google'] = googleStatus;
  statusMap['youtube'] = googleStatus;
  statusMap['steam'] = steamStatus;
  statusMap['facebook'] = metaStatus;
  statusMap['instagram'] = metaStatus;
  statusMap['whatsapp'] = metaStatus;
  statusMap['aws'] = awsStatus;
  statusMap['starlink'] = starlinkStatus;
  statusMap['flow'] = flowStatus;
  statusMap['personal'] = personalStatus;
  statusMap['claro'] = claroStatus;
  statusMap['movistar'] = movistarStatus;

  // Falsos positivos: forzar online en servicios críticos si están en warning
  const ALWAYS_ONLINE = ['vercel', 'cloudflare'];
  ALWAYS_ONLINE.forEach(id => {
    if (statusMap[id] === 'warning') {
      statusMap[id] = 'online';
    }
  });

  return NextResponse.json({
    success: true,
    services: statusMap,
    timestamp: new Date().toISOString()
  });
}
