import { Service } from "@/types";

export const INITIAL_SERVICES: Service[] = [
  // TELECOMUNICACIONES
  { id: 'movistar', name: 'Movistar Argentina', type: 'proxy', displayUrl: 'movistar.com.ar', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(22), group: 'Telecomunicaciones' },
  { id: 'flow', name: 'Personal Flow', type: 'proxy', displayUrl: 'personalflow.com.ar', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(45), group: 'Telecomunicaciones' },
  { id: 'personal', name: 'Personal Argentina', type: 'proxy', displayUrl: 'personal.com.ar', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(15), group: 'Telecomunicaciones' },
  { id: 'claro', name: 'Claro Argentina', type: 'proxy', displayUrl: 'claro.com.ar', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(18), group: 'Telecomunicaciones' },
  { id: 'starlink', name: 'Starlink', type: 'proxy', displayUrl: 'starlink.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(50), group: 'Telecomunicaciones' },

  // MENSAJERÍA
  { id: 'whatsapp', name: 'WhatsApp', type: 'proxy', displayUrl: 'whatsapp.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(15), group: 'Mensajería' },
  { id: 'telegram', name: 'Telegram Messenger', type: 'proxy', displayUrl: 'telegram.org', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(25), group: 'Mensajería' },
  { id: 'signal', name: 'Signal Messenger', type: 'proxy', displayUrl: 'signal.org', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(20), group: 'Mensajería' },
  { id: 'discord', name: 'Discord', type: 'public', displayUrl: 'discord.com', endpoint: 'https://discordstatus.com/api/v2/status.json', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(30), group: 'Mensajería' },
  { id: 'gmail', name: 'Gmail', type: 'proxy', displayUrl: 'mail.google.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(20), group: 'Mensajería' },

  // REDES SOCIALES
  { id: 'twitter', name: 'X / Twitter', type: 'proxy', displayUrl: 'x.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(40), group: 'Redes Sociales' },
  { id: 'instagram', name: 'Instagram', type: 'proxy', displayUrl: 'instagram.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(25), group: 'Redes Sociales' },
  { id: 'facebook', name: 'Facebook', type: 'proxy', displayUrl: 'facebook.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(25), group: 'Redes Sociales' },

  // DESARROLLO
  { id: 'github', name: 'GitHub', type: 'public', displayUrl: 'github.com', endpoint: 'https://www.githubstatus.com/api/v2/status.json', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(25), group: 'Desarrollo' },
  { id: 'vercel', name: 'Vercel', type: 'public', displayUrl: 'vercel-status.com', endpoint: 'https://www.vercel-status.com/api/v2/status.json', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(15), group: 'Desarrollo' },

  // INFRAESTRUCTURA
  { id: 'cloudflare', name: 'Cloudflare', type: 'public', displayUrl: 'cloudflarestatus.com', endpoint: 'https://www.cloudflarestatus.com/api/v2/status.json', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(10), group: 'Infraestructura' },
  { id: 'aws', name: 'Amazon Web Services', type: 'proxy', displayUrl: 'health.aws.amazon.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(15), group: 'Infraestructura' },
  { id: 'google', name: 'Google Cloud / Services', type: 'proxy', displayUrl: 'google.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(10), group: 'Infraestructura' },
  { id: 'microsoft', name: 'Microsoft 365', type: 'proxy', displayUrl: 'office.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(35), group: 'Infraestructura' },
  
  // IA
  { 
    id: 'openai', 
    name: 'OpenAI / ChatGPT', 
    type: 'public', 
    displayUrl: 'openai.com', 
    endpoint: 'https://status.openai.com/api/v2/status.json', 
    status: 'warning', 
    history: Array(24).fill(1), 
    latencyHistory: Array(10).fill(45), 
    group: 'IA',
    incident: {
      en: {
        title: "We're currently experiencing issues",
        description: "Elevated errors for sign-in and account creation\nWe have applied the mitigation and are monitoring the recovery.",
        status: "Monitoring"
      },
      es: {
        title: "Actualmente estamos experimentando problemas",
        description: "Errores elevados en el inicio de sesión y creación de cuentas\nHemos aplicado una mitigación y estamos monitoreando la recuperación.",
        status: "Monitoreando"
      }
    }
  },
  { id: 'anthropic', name: 'Anthropic / Claude', type: 'public', displayUrl: 'anthropic.com', endpoint: 'https://status.anthropic.com/api/v2/status.json', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(60), group: 'IA' },

  // STREAMING
  { id: 'youtube', name: 'YouTube', type: 'proxy', displayUrl: 'youtube.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(20), group: 'Streaming' },
  { id: 'twitch', name: 'Twitch', type: 'public', displayUrl: 'twitch.tv', endpoint: 'https://status.twitch.tv/api/v2/status.json', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(35), group: 'Streaming' },
  { id: 'kick', name: 'Kick', type: 'proxy', displayUrl: 'kick.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(40), group: 'Streaming' },

  // JUEGOS
  { id: 'steam', name: 'Steam', type: 'proxy', displayUrl: 'steampowered.com', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(30), group: 'Juegos' },
  { id: 'epic', name: 'Epic Games', type: 'public', displayUrl: 'epicgames.com', endpoint: 'https://status.epicgames.com/api/v2/status.json', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(40), group: 'Juegos' },
  { id: 'battlenet', name: 'Battle.net', type: 'proxy', displayUrl: 'battle.net', status: 'loading', history: Array(24).fill(1), latencyHistory: Array(10).fill(50), group: 'Juegos' },
];

export const SECURITY_ALERTS: Record<string, string> = {
  github: "Filtración detectada en 2024 · Cambiá tu contraseña",
  facebook: "Datos de 533M usuarios expuestos",
};

export const TRANSLATIONS = {
  es: {
    dashboard: "Servicios",
    popular: "Populares",
    security: "Seguridad",
    servicesSubtitle: "Estado en tiempo real de los servicios que usás",
    hero: "¿Se cayó o soy yo?",
    subTitle: "Estado de los servicios que usás todos los días",
    online: "Disponible",
    degraded: "Problemas",
    down: "Caído",
    checking: "Verificando...",
    noIssues: "Sin reportes de problemas de seguridad",
    warningMsg: "Algunos usuarios reportan fallas",
    offlineMsg: "No responde · revisando",
    allGood: "Todo funciona con normalidad",
    someIssues: "servicios con problemas",
    criticalIssues: "servicios no disponibles ahora",
    alertMsg: "Hay problemas en:",
    lastUpdated: "Actualizado hace",
    seconds: "segundos",
    minutes: "minutos",
    footer: "Datos obtenidos directamente de las fuentes oficiales de cada servicio",
    liveLabel: "EN VIVO",
    searchPlaceholder: "Buscar un servicio...",
    all: "Todo",
    social: "Redes Sociales",
    messaging: "Mensajería",
    games: "Juegos",
    streaming: "Streaming",
    ai: "IA",
    infra: "Infraestructura",
    telecom: "Telecomunicaciones",
    dev: "Desarrollo",
    createdBy: "Hecho con",
  },
  en: {
    dashboard: "Services",
    popular: "Popular",
    security: "Security",
    servicesSubtitle: "Real-time status of the services you use",
    hero: "Is it down or is it me?",
    subTitle: "Status of the services you use every day",
    online: "Available",
    degraded: "Issues",
    down: "Down",
    checking: "Checking...",
    noIssues: "No issues reported",
    warningMsg: "Some users reporting problems",
    offlineMsg: "Not responding · checking",
    allGood: "All systems running normally",
    someIssues: "services with issues",
    criticalIssues: "services unavailable now",
    alertMsg: "There are problems in:",
    lastUpdated: "Updated",
    seconds: "seconds ago",
    minutes: "minutes ago",
    footer: "Data obtained directly from the official sources of each service",
    liveLabel: "LIVE",
    searchPlaceholder: "Search for a service...",
    all: "All",
    social: "Social Media",
    messaging: "Messaging",
    games: "Games",
    streaming: "Streaming",
    ai: "AI",
    infra: "Infrastructure",
    telecom: "Telecommunications",
    dev: "Development",
    createdBy: "Made with",
  }
};
