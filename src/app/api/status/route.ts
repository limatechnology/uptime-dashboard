import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';
import { INITIAL_SERVICES } from '@/lib/constants';

const dnsLookup = promisify(dns.lookup);

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

// 1. DNS Check (Usando lookup para mayor compatibilidad)
async function checkDNS(host: string): Promise<boolean> {
  try {
    const p = Promise.race([
      dnsLookup(host),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIMEOUTS.DNS))
    ]);
    await p; // dnsLookup returns an object { address, family }
    return true;
  } catch {
    return false;
  }
}

// 2. Fallbacks inteligentes y detección de degradación
async function checkServiceStatus(id: string, displayUrl: string, endpoint?: string) {
  const host = displayUrl.replace(/^https?:\/\//, '').split('/')[0];
  const startTime = Date.now();
  let lastUsed: 'dns' | 'statusPage' | 'api' | 'homepage' = 'dns';

  try {
    // A. Si tiene Status Page (JSON de Atlassian Statuspage o similar)
    // Intentamos summary.json primero para tener detalles si hay problemas
    const statusUrl = (PUBLIC_STATUS_PAGES[id] || endpoint)?.replace('status.json', 'summary.json');
    
    if (statusUrl && statusUrl.includes('/api/v2/summary.json')) {
      lastUsed = 'statusPage';
      try {
        const res = await fetchWithTimeout(statusUrl, { method: 'GET' }, TIMEOUTS.STATUS_PAGE);
        if (res.ok) {
          const data = await res.json();
          const indicator = data.status?.indicator || 'none';
          const incidents = data.incidents || [];
          const components = data.components || [];

          // Caso especial: indicator minor pero sin incidentes activos
          // Probablemente es un problema localizado o programado menor
          let effectiveStatus: 'online' | 'warning' | 'offline' = 'online';
          if (indicator === 'minor' || indicator === 'warning') {
            // Si hay incidentes activos, es warning seguro
            if (incidents.length > 0) {
              effectiveStatus = 'warning';
            } else {
              // Si no hay incidentes, solo es warning si más de 2 componentes o componentes core tienen fallas
              const degradedCount = components.filter((c: any) => c.status !== 'operational').length;
              if (degradedCount > 3) {
                effectiveStatus = 'warning';
              } else {
                effectiveStatus = 'online'; // Relaxed check
              }
            }
          } else if (indicator === 'critical' || indicator === 'major') {
            effectiveStatus = 'offline';
          }

          let incidentInfo = undefined;
          if (incidents.length > 0) {
            const activeIncident = incidents[0];
            incidentInfo = {
              title: activeIncident.name,
              description: activeIncident.incident_updates?.[0]?.body,
              status: activeIncident.status,
              updatedAt: activeIncident.updated_at
            };
          } else if (effectiveStatus === 'warning' || (indicator !== 'none' && effectiveStatus === 'online')) {
            // Note about degraded components if no incident
            const degraded = components.filter((c: any) => c.status !== 'operational');
            if (degraded.length > 0) {
              incidentInfo = {
                title: 'Problemas localizados',
                description: `Se detectaron problemas en: ${degraded.slice(0, 2).map((c: any) => c.name).join(', ')}${degraded.length > 2 ? ' y otros' : ''}. El servicio general debería funcionar.`,
                status: 'degraded'
              };
            }
          }

          return { 
            status: effectiveStatus, 
            latency: Date.now() - startTime, 
            lastUsed: 'statusPage',
            incident: incidentInfo
          };
        }
      } catch (err) {
        console.warn(`[StatusPage Error] ${id}:`, err instanceof Error ? err.message : 'Unknown');
      }
    }

    // B. Si es proxy o falló lo anterior, probamos DNS Check (Mantiene alta performance)
    if (await checkDNS(host)) {
      return { status: 'online', latency: Date.now() - startTime, lastUsed: 'dns' };
    }

    // C. HEAD request a homepage (Check real de servidor web)
    lastUsed = 'homepage';
    try {
      const res = await fetchWithTimeout(`https://${displayUrl}`, { method: 'HEAD' }, TIMEOUTS.HOMEPAGE);
      if (res.ok || (res.status >= 300 && res.status < 400)) {
        return { status: 'online', latency: Date.now() - startTime, lastUsed: 'homepage' };
      }
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

  // Usamos los servicios definidos en INITIAL_SERVICES para mantener la sincronización
  const servicesToCheck = INITIAL_SERVICES.map(s => ({
    id: s.id,
    host: s.displayUrl,
    priority: s.priority,
    endpoint: s.endpoint
  }));

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
      incident: r.incident,
      timestamp: new Date().toISOString()
    };
  });

  // Detección Regional (ISPs Argentina)
  const argIsps = ['movistar', 'flow', 'personal-id', 'personal-api', 'claro'];
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

