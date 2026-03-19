import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);

// CONFIGURACIÓN DE TIEMPOS
const TIMEOUTS = {
  DNS: 2000,
  STATUS_PAGE: 3000,
  API: 2000,
  HOMEPAGE: 3000
};

// FUENTES DE CONFIRMACIÓN (DNS PÚBLICOS)
const PUBLIC_DNS = ['8.8.8.8', '1.1.1.1', '9.9.9.9'];

const PUBLIC_STATUS_PAGES: Record<string, string> = {
  github: 'https://www.githubstatus.com/api/v2/status.json',
  openai: 'https://status.openai.com/api/v2/status.json',
  discord: 'https://discordstatus.com/api/v2/status.json',
  anthropic: 'https://status.anthropic.com/api/v2/status.json',
  twitch: 'https://status.twitch.tv/api/v2/status.json',
  epic: 'https://status.epicgames.com/api/v2/status.json',
  vercel: 'https://www.vercel-status.com/api/v2/status.json',
  cloudflare: 'https://www.cloudflarestatus.com/api/v2/status.json',
  microsoft: 'https://azure.status.microsoft/api/v2/status.json',
  battlenet: 'https://status.blizzard.com/api/v2/status.json',
  kick: 'https://status.kick.com/api/v2/status.json',
};

// Ayudante para fetch con timeout
async function fetchWithTimeout(url: string, options: any = {}, timeout: number = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// 1. DNS Check
async function checkDNS(host: string): Promise<boolean> {
  try {
    const p = Promise.race([
      resolve4(host),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIMEOUTS.DNS))
    ]);
    await p;
    return true;
  } catch {
    return false;
  }
}

// 2. Fallbacks inteligentes
async function checkServiceStatus(id: string, displayUrl: string, endpoint?: string) {
  const host = displayUrl.replace(/^https?:\/\//, '').split('/')[0];
  const startTime = Date.now();
  let lastUsed: 'dns' | 'statusPage' | 'api' | 'homepage' | 'ping' = 'dns';

  try {
    // Primero: DNS check
    if (await checkDNS(host)) {
      return { status: 'online', latency: Date.now() - startTime, lastUsed: 'dns' };
    }

    // Si falla: HEAD request a status page (si es public)
    if (PUBLIC_STATUS_PAGES[id]) {
      lastUsed = 'statusPage';
      try {
        const res = await fetchWithTimeout(PUBLIC_STATUS_PAGES[id], { method: 'HEAD' }, TIMEOUTS.STATUS_PAGE);
        if (res.ok) return { status: 'online', latency: Date.now() - startTime, lastUsed: 'statusPage' };
      } catch {}
    }

    // Si falla: GET a API endpoint
    if (endpoint) {
      lastUsed = 'api';
      try {
        const res = await fetchWithTimeout(endpoint, { method: 'GET' }, TIMEOUTS.API);
        if (res.ok) return { status: 'online', latency: Date.now() - startTime, lastUsed: 'api' };
      } catch {}
    }

    // Si falla: HEAD request a homepage
    lastUsed = 'homepage';
    try {
      const res = await fetchWithTimeout(`https://${displayUrl}`, { method: 'HEAD' }, TIMEOUTS.HOMEPAGE);
      if (res.ok) return { status: 'online', latency: Date.now() - startTime, lastUsed: 'homepage' };
    } catch {}

    return { status: 'offline', latency: Date.now() - startTime, lastUsed };
  } catch (e) {
    return { status: 'offline', latency: Date.now() - startTime, lastUsed };
  }
}

// Verificación de conectividad global (Google/Cloudflare DNS)
async function verifyGlobalConnectivity() {
  const checks = await Promise.allSettled(PUBLIC_DNS.map(dnsIp => checkDNS(dnsIp)));
  return checks.some(c => c.status === 'fulfilled' && c.value === true);
}

// CACHE EN MEMORIA (Simplificada)
let lastResults: any = null;
let lastCheckTime = 0;
const CACHE_TTL = 50000; // 50 segundos (un poco menos que el intervalo de 60s)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isBypassCache = searchParams.get('full') === 'true';
  const now = Date.now();

  // Si tenemos caché fresco y no se pide bypass, devolver caché
  if (!isBypassCache && lastResults && (now - lastCheckTime < CACHE_TTL)) {
    return NextResponse.json({
      ...lastResults,
       fromCache: true,
       nextUpdateIn: Math.round((CACHE_TTL - (now - lastCheckTime)) / 1000)
    });
  }

  const startTime = Date.now();

  // Lista de servicios de prueba (en producción esto vendría de constants pero para la API lo manejamos así)
  const servicesToCheck = [
    { id: 'movistar', host: 'movistar.com.ar', priority: 'high' },
    { id: 'flow', host: 'personalflow.com.ar', priority: 'high' },
    { id: 'personal', host: 'personal.com.ar', priority: 'high' },
    { id: 'claro', host: 'claro.com.ar', priority: 'high' },
    { id: 'whatsapp', host: 'whatsapp.com', priority: 'medium' },
    { id: 'instagram', host: 'instagram.com', priority: 'medium' },
    { id: 'discord', host: 'discord.com', priority: 'medium', endpoint: 'https://discordstatus.com/api/v2/status.json' },
    { id: 'youtube', host: 'youtube.com', priority: 'medium' },
    { id: 'github', host: 'github.com', priority: 'low', endpoint: 'https://www.githubstatus.com/api/v2/status.json' },
    { id: 'google', host: 'google.com', priority: 'low' },
    { id: 'twitter', host: 'x.com', priority: 'medium' },
    { id: 'telegram', host: 'telegram.org', priority: 'medium' },
    { id: 'steam', host: 'steampowered.com', priority: 'low' },
    { id: 'openai', host: 'openai.com', priority: 'medium', endpoint: 'https://status.openai.com/api/v2/status.json' },
    { id: 'cloudflare', host: 'cloudflare.com', priority: 'low', endpoint: 'https://www.cloudflarestatus.com/api/v2/status.json' },
  ];

  const results: Record<string, any> = {};
  
  // Realizamos los chequeos en paralelo para velocidad
  const checkPromises = servicesToCheck.map(async (s) => {
    // Si no es full check, solo chequeamos high/medium en ticks impares, etc (simplificado para esta demo)
    const result = await checkServiceStatus(s.id, s.host, s.endpoint);
    return { id: s.id, ...result };
  });

  const checkedResults = await Promise.all(checkPromises);
  checkedResults.forEach(r => {
    results[r.id] = {
      status: r.status,
      latency: r.latency,
      lastFallback: r.lastUsed,
      timestamp: new Date().toISOString()
    };
  });

  // Detección Regional (ISPs Argentina)
  const argIsps = ['movistar', 'flow', 'personal', 'claro'];
  const failedArgIsps = argIsps.filter(id => results[id]?.status === 'offline');
  
  let regionalAlert = false;
  if (failedArgIsps.length >= 3) {
    const isGlobalUp = await verifyGlobalConnectivity();
    if (isGlobalUp) {
      regionalAlert = true;
      console.log(`[REGIONAL] Posible caída ISP detectada: ${failedArgIsps.join(', ')}`);
    } else {
      console.log(`[GLOBAL] Posible problema de conexión local del monitor`);
    }
  }

  // Falsos positivos: Si todos fallan pero el DNS público también = problema del monitor
  const allFailed = checkedResults.every(r => r.status === 'offline');
  if (allFailed) {
    const isGlobalUp = await verifyGlobalConnectivity();
    if (!isGlobalUp) {
      // Revertir a online o status desconocido ya que el monitor no tiene internet
      Object.keys(results).forEach(id => {
        results[id].status = 'online'; // O 'loading'/'unknown'
        results[id].note = 'Monitor connection issue';
      });
    }
  }

  const finalResponse = {
    success: true,
    services: results,
    regionalAlert,
    timestamp: new Date().toISOString(),
    fromCache: false
  };

  // Guardar en caché antes de responder
  lastResults = finalResponse;
  lastCheckTime = Date.now();

  return NextResponse.json(finalResponse);
}

