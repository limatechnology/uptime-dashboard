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
  kick: 'https://status.kick.com/api/v2/status.json',
};

async function getAtlassianStatus(url: string, serviceKey?: string) {
  try {
    const summaryUrl = url.replace('status.json', 'summary.json');
    const res = await fetch(summaryUrl, { next: { revalidate: 60 } });
    const data = await res.json();
    const indicator = data.status?.indicator || 'none';
    let status = 'online';
    let incident = null;
    let hasActiveIncident = false;

    if (data.incidents && data.incidents.length > 0) {
      const activeIncident = data.incidents[0];
      // Check if the latest incident is actually active
      if (activeIncident.status !== 'resolved' && activeIncident.status !== 'postmortem') {
        hasActiveIncident = true;
        incident = {
          title: activeIncident.name,
          description: activeIncident.incident_updates?.[0]?.body || '',
          status: activeIncident.status,
          updatedAt: activeIncident.updated_at || activeIncident.created_at
        };
      }
    }

    if (indicator !== 'none' || hasActiveIncident) {
      if (serviceKey === 'vercel' && indicator !== 'none') {
        if (indicator === 'major' || indicator === 'critical') status = 'warning';
      } else {
        status = 'warning';
        if (indicator === 'critical') status = 'offline';
      }
    }
    
    return { status, incident };
  } catch (e) {
    try {
      const fallbackRes = await fetch(url, { next: { revalidate: 60 } });
      const fallbackData = await fallbackRes.json();
      const indicator = fallbackData.status?.indicator || 'none';
      let status = 'online';
      if (indicator !== 'none') {
        if (indicator === 'critical') status = 'offline';
        else status = 'warning';
      }
      return { status };
    } catch {
      return { status: 'online' };
    }
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
    
    if (active.length === 0) return { status: 'online' };
    
    return { 
      status: 'warning', 
      incident: {
        title: active[0].external_desc || 'Google Cloud Incident',
        description: '',
        status: 'Investigating',
        updatedAt: active[0].modified || active[0].created
      }
    };
  } catch (e) {
    return { status: 'online' };
  }
}

async function getSteamStatus() {
  try {
    const res = await fetch('https://steamstat.us/status.json', { next: { revalidate: 60 } });
    const data = await res.json();
    if (data.services?.steam?.status === 'normal') return { status: 'online' };
    return { status: 'warning' };
  } catch (e) {
    return { status: 'online' };
  }
}

async function getIsDownStatus(service: string) {
  try {
    const res = await fetch(
      `https://isdown.app/integrations/${service}.json`,
      { next: { revalidate: 60 } }
    );
    const data = await res.json();
    if (data.status === 'operational') return { status: 'online' };
    if (data.status === 'degraded' || data.status === 'disruption') return { status: 'warning' };
    if (data.status === 'outage') return { status: 'offline' };
    return { status: 'online' };
  } catch {
    return { status: 'online' };
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
    if (!res.ok) return { status: 'warning' };
    if (latency > 3000) return { status: 'warning' };
    return { status: 'online' };
  } catch {
    return { status: 'online' }; 
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
    telegramStatus,
    signalStatus,
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
    getPingStatus('https://telegram.org'),
    getPingStatus('https://signal.org'),
  ]);

  const statusMap: Record<string, any> = Object.fromEntries(atlassianResults);
  statusMap['google'] = googleStatus;
  statusMap['youtube'] = googleStatus;
  statusMap['gmail'] = googleStatus;
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
  statusMap['telegram'] = telegramStatus;
  statusMap['signal'] = signalStatus;

  // Falsos positivos: forzar online en servicios críticos si están en warning
  const ALWAYS_ONLINE = ['vercel', 'cloudflare'];
  ALWAYS_ONLINE.forEach(id => {
    if (statusMap[id]?.status === 'warning') {
      statusMap[id] = { status: 'online' };
    }
  });

  return NextResponse.json({
    success: true,
    services: statusMap,
    timestamp: new Date().toISOString()
  });
}
