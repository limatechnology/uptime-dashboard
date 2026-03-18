"use client";

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Lock, 
  Shield, 
  Eye, 
  RefreshCw, 
  Wifi, 
  Bell, 
  CheckCircle2, 
  MessageCircle, 
  ChevronDown,
  AlertTriangle,
  ExternalLink,
  Search
} from "lucide-react";
import { INITIAL_SERVICES } from "@/lib/constants";

type Tab = "leaks" | "news" | "tips" | "consultancy";

const KNOWN_BREACHES: Record<string, { title: string, description: string, date: string, severity: "critical" | "high" | "medium" | "low", severityLevel: number }> = {
  microsoft: {
    title: "Acceso no autorizado - Midnight Blizzard",
    description: "Grupo ruso accedió a emails corporativos de Microsoft",
    date: "2024-01-12",
    severity: "high",
    severityLevel: 1
  },
  twitter: {
    title: "Filtración de datos de usuarios",
    description: "200 millones de emails expuestos en foro de hackers",
    date: "2023-01-04",
    severity: "high",
    severityLevel: 1
  },
  facebook: {
    title: "Exposición de datos - Meta",
    description: "Datos de cuentas expuestos por configuración incorrecta",
    date: "2024-04-01",
    severity: "medium",
    severityLevel: 2
  },
  discord: {
    title: "Breach via proveedor tercero",
    description: "Datos de usuarios expuestos a través de proveedor de soporte",
    date: "2023-05-12",
    severity: "medium",
    severityLevel: 2
  },
  openai: {
    title: "Filtración de conversaciones",
    description: "Bug expuso títulos de conversaciones de otros usuarios",
    date: "2024-03-20",
    severity: "low",
    severityLevel: 3
  }
};

const isBreachRecent = (dateStr: string) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const breachDate = new Date(dateStr);
  return !isNaN(breachDate.getTime()) && breachDate > twelveMonthsAgo;
};

const formatBreachDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const formatted = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const getRelativeTime = (dateStr: string, lang: 'es' | 'en') => {
  const date = new Date(dateStr);
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  const days = Math.floor(diffInSeconds / 86400);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (lang === 'es') {
    if (years > 0) return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
    if (months > 0) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    if (weeks > 0) return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    if (days > 0) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    return 'hoy';
  } else {
    if (years > 0) return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    if (months > 0) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    if (weeks > 0) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    return 'today';
  }
};

const SECURITY_TIPS = [
  {
    icon: Lock,
    title: "Usá contraseñas únicas",
    description: "No repitas la misma contraseña en distintos servicios. Usá un gestor como Bitwarden o 1Password."
  },
  {
    icon: Shield,
    title: "Activá el doble factor",
    description: "Habilitá la verificación en dos pasos en WhatsApp, Gmail, Instagram y cualquier servicio importante."
  },
  {
    icon: Eye,
    title: "Revisá qué apps tienen acceso",
    description: "En cada servicio, revisá qué aplicaciones de terceros tienen acceso a tu cuenta y revocá las que no uses."
  },
  {
    icon: RefreshCw,
    title: "Actualizá tus contraseñas",
    description: "Si un servicio tuvo una filtración, cambiá tu contraseña aunque no hayas sido afectado directamente."
  },
  {
    icon: Wifi,
    title: "Cuidado con el WiFi público",
    description: "Evitá ingresar a servicios importantes desde redes públicas sin usar una VPN."
  },
  {
    icon: Bell,
    title: "Activá alertas de acceso",
    description: "Configurá notificaciones de inicio de sesión en Gmail, Facebook e Instagram para detectar accesos raros."
  }
];

const FAQS = [
  {
    q: "¿Cómo sé si mis datos fueron filtrados?",
    a: "Podés verificarlo en haveibeenpwned.com ingresando tu email. Es gratuito y confiable."
  },
  {
    q: "¿Qué hago si un servicio fue hackeado?",
    a: "Cambiá tu contraseña de inmediato, revisá tus sesiones activas y activá el doble factor."
  },
  {
    q: "¿Cada cuánto debo cambiar mis contraseñas?",
    a: "Solo cuando hay una filtración confirmada o sospechás de acceso no autorizado. Cambiarlas sin motivo es un mito."
  },
  {
    q: "¿Es seguro usar el mismo email en todos lados?",
    a: "Sí, pero usá contraseñas distintas en cada servicio y activá el doble factor donde sea posible."
  }
];

export function SecurityPage({ lang }: { lang: 'es' | 'en' }) {
  const [activeTab, setActiveTab] = useState<Tab>("leaks");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const refreshNews = () => {
      setLoadingNews(true);
      fetch('/api/security-news')
        .then(res => res.json())
        .then(data => {
            setNews(data.articles || []);
        })
        .catch(err => console.error("Error fetching news:", err))
        .finally(() => setLoadingNews(false));
    };

    if (activeTab === 'news' && news.length === 0) {
      refreshNews();
    }

    window.addEventListener('refresh-security', refreshNews);
    return () => window.removeEventListener('refresh-security', refreshNews);
  }, [activeTab, news.length]);

  const getSeverityPillStyle = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'bg-[#ef4444]/5 text-[#ef4444] border-[#ef4444]/20';
      case 'high': return 'bg-[#f97316]/5 text-[#f97316] border-[#f97316]/20';
      case 'medium': return 'bg-[#f59e0b]/5 text-[#f59e0b] border-[#f59e0b]/20';
      case 'low': return 'bg-[#6C63FF]/5 text-[#6C63FF] border-[#6C63FF]/20';
      default: return 'bg-[#22c55e]/5 text-[#22c55e] border-[#22c55e]/20';
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-status-red/5 text-status-red border-status-red/10';
      case 'high': return 'bg-orange-500/5 text-orange-500 border-orange-500/10';
      case 'medium': return 'bg-status-yellow/5 text-status-yellow border-status-yellow/10';
      case 'low': return 'bg-it-blue/5 text-it-blue border-it-blue/10';
      default: return 'bg-white/5 text-text-muted border-white/10';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return { text: lang === 'es' ? 'CRÍTICO' : 'CRITICAL', color: 'text-status-red', dot: 'bg-status-red' };
      case 'high': return { text: lang === 'es' ? 'ALTO' : 'HIGH', color: 'text-orange-500', dot: 'bg-orange-500' };
      case 'medium': return { text: lang === 'es' ? 'MEDIO' : 'MEDIUM', color: 'text-status-yellow', dot: 'bg-status-yellow' };
      case 'low': return { text: lang === 'es' ? 'BAJO' : 'LOW', color: 'text-it-blue', dot: 'bg-it-blue' };
      default: return null;
    }
  };

  const sortedLeaks = [...INITIAL_SERVICES].sort((a, b) => {
    const aLeakInfo = KNOWN_BREACHES[a.id];
    const bLeakInfo = KNOWN_BREACHES[b.id];
    
    const aValid = aLeakInfo && isBreachRecent(aLeakInfo.date);
    const bValid = bLeakInfo && isBreachRecent(bLeakInfo.date);

    const aLevel = aValid ? aLeakInfo.severityLevel : 4;
    const bLevel = bValid ? bLeakInfo.severityLevel : 4;
    return aLevel - bLevel;
  });

  const filteredLeaks = sortedLeaks.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.displayUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (KNOWN_BREACHES[s.id]?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (n.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTips = SECURITY_TIPS.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-12">
      {/* Buscador */}
      <div className="relative group flex items-center w-full max-w-2xl animate-in">
        <Search className="absolute left-5 w-4.5 h-4.5 text-text-muted group-focus-within:text-[#6C63FF] transition-colors duration-300" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={lang === 'es' ? 'Buscar servicio, filtración o noticia...' : 'Search service, breach or news...'}
          className="bg-card-bg/50 border border-card-border rounded-2xl py-[15.7px] pl-[54.9px] pr-[31.4px] text-[15px] font-semibold w-full outline-none focus:bg-card-bg focus:border-[#6C63FF]/50 soft-shadow transition-all duration-300 text-text-main placeholder:text-text-muted/40"
        />
      </div>

      {/* Tabs Internas */}
      <div className="flex items-center gap-2 p-1 bg-background-main border border-card-border rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        {[
          { id: 'leaks', label: lang === 'es' ? 'Filtraciones' : 'Breaches' },
          { id: 'news', label: lang === 'es' ? 'Noticias' : 'News' },
          { id: 'tips', label: lang === 'es' ? 'Consejos' : 'Tips' },
          { id: 'consultancy', label: lang === 'es' ? 'Asesoría' : 'Consultancy' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-6 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
              ? 'bg-[#6C63FF] text-white shadow-[0_4px_15px_rgba(108,99,255,0.3)] shrink-0' 
              : 'text-text-muted hover:text-white border border-transparent hover:border-[#6C63FF]/20 shrink-0'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de Tabs */}
      <div className="min-h-[400px]">
        {activeTab === 'leaks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
            {filteredLeaks.map(service => {
              const rawBreach = KNOWN_BREACHES[service.id];
              const breach = rawBreach && isBreachRecent(rawBreach.date) ? rawBreach : null;
              const severityInfo = breach ? getSeverityLabel(breach.severity) : null;
              
              return (
                <div key={service.id} className="bg-card-bg border border-card-border p-6 rounded-3xl flex flex-col gap-5 hover:border-[#6C63FF]/40 transition-all duration-300 group shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg border border-card-border flex items-center justify-center overflow-hidden p-1">
                        <img 
                          src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${service.displayUrl
                            .replace('health.aws.amazon.com', 'aws.amazon.com')
                            .replace('vercel-status.com', 'vercel.com')
                            .replace('cloudflarestatus.com', 'cloudflare.com')
                            .replace('personalflow.com.ar', 'www.flow.com.ar')
                            .replace('movistar.com.ar', 'www.movistar.es')
                            .replace('claro.com.ar', 'www.claro.com.ar')
                            .replace('personal.com.ar', 'www.personal.com.ar')
                          }&size=128`}
                          alt={service.name}
                          className="w-full h-full object-contain rounded-md"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-white uppercase tracking-tight">{service.name}</span>
                    </div>
                    {breach ? (
                      <span className={`border px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${getSeverityPillStyle(breach.severity)}`}>
                        {severityInfo?.text}
                      </span>
                    ) : (
                      <span className={`border px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${getSeverityPillStyle()}`}>
                        {lang === 'es' ? 'SEGURO' : 'SAFE'}
                      </span>
                    )}
                  </div>

                  {breach ? (
                    <div className="space-y-3 pt-2">
                       <div className={`p-4 rounded-2xl border ${getSeverityStyle(breach.severity)}`}>
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black uppercase tracking-widest opacity-90">{breach.title}</span>
                           <span className="text-[10px] font-bold opacity-50">{formatBreachDate(breach.date)}</span>
                         </div>
                         
                         <p className="text-[11px] leading-relaxed font-semibold opacity-80">{breach.description}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="pt-2 min-h-[80px] flex items-center">
                      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        {lang === 'es' ? 'No se han detectado incidentes de seguridad públicos asociados a este servicio en los últimos 12 meses.' : 'No public security incidents associated with this service have been detected in the last 12 months.'}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto pt-2 border-t border-white/5">
                    {breach ? (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${severityInfo?.dot}`} />
                        <span className={`text-[11px] font-semibold truncate ${severityInfo?.color}`}>
                          {lang === 'es' ? 'Alerta Activa' : 'Active Alert'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
                        <span className="text-[11px] text-zinc-500 font-semibold">
                          {lang === 'es' ? 'Sin incidentes conocidos' : 'No known incidents'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="flex flex-col gap-6 animate-in">
            {loadingNews && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card-bg border border-card-border p-6 rounded-3xl flex flex-col gap-4 animate-pulse h-[200px]">
                     <div className="flex items-center gap-2">
                       <div className="w-8 h-5 bg-white/5 rounded-md"></div>
                       <div className="w-24 h-5 bg-white/5 rounded-md"></div>
                     </div>
                     <div className="w-full h-10 bg-white/5 rounded-md mt-2"></div>
                     <div className="w-full h-8 bg-white/5 rounded-md"></div>
                     <div className="mt-auto w-32 h-4 bg-white/5 rounded-md"></div>
                  </div>
                ))}
              </div>
            )}
            
            {!loadingNews && filteredNews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNews.map((article, idx) => {
                  let catStyle = '';
                  let catLabel = '';
                  switch(article.category) {
                    case 'breach': 
                      catStyle = 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20'; 
                      catLabel = lang === 'es' ? 'Filtración' : 'Breach'; 
                      break;
                    case 'vulnerability': 
                      catStyle = 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20'; 
                      catLabel = lang === 'es' ? 'Vulnerabilidad' : 'Vulnerability'; 
                      break;
                    case 'ransomware': 
                      catStyle = 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20'; 
                      catLabel = 'Ransomware'; 
                      break;
                    case 'general': 
                    default: 
                      catStyle = 'bg-[#6C63FF]/10 text-[#6C63FF] border-[#6C63FF]/20'; 
                      catLabel = 'General'; 
                      break;
                  }

                  return (
                    <a 
                      key={idx} 
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-card-bg border border-card-border p-6 rounded-3xl flex flex-col gap-4 hover:border-[#6C63FF]/40 transition-all duration-300 shadow-sm group min-h-[200px] h-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                           {article.lang === 'es' ? (
                              <span className="bg-[#B8F500]/20 text-[#B8F500] px-2 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest shrink-0">ES</span>
                            ) : (
                              <span className="bg-zinc-500/20 text-zinc-400 px-2 py-0.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest shrink-0">EN</span>
                            )}
                            <span className={`border px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-widest ${catStyle}`}>
                              {catLabel}
                            </span>
                        </div>
                        <ExternalLink className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      <div className="space-y-2">
                         <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 group-hover:text-[#6C63FF] transition-colors">{article.title}</h3>
                         <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2" title={article.description}>{article.description}</p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-500 truncate pr-2 opacity-80">{article.source}</span>
                        <span className="text-[11px] font-medium text-zinc-500 shrink-0 opacity-80 capitalize">{getRelativeTime(article.publishedAt, lang)}</span>
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
            
            {!loadingNews && filteredNews.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-card-bg border border-card-border rounded-3xl">
                  <span className="text-zinc-500 font-medium">
                    {news.length === 0 ? (lang === 'es' ? 'No hay noticias recientes.' : 'No recent news.') : (lang === 'es' ? 'No se encontraron resultados.' : 'No results found.')}
                  </span>
                </div>
            )}
          </div>
        )}

        {activeTab === 'tips' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
            {filteredTips.map((tip, idx) => (
              <div key={idx} className="bg-card-bg border border-card-border p-8 rounded-[32px] flex flex-col items-center text-center gap-6 hover:border-[#6C63FF]/40 transition-all duration-300 shadow-sm group">
                <div className="w-16 h-16 bg-[#6C63FF]/10 rounded-2xl flex items-center justify-center border border-[#6C63FF]/20 group-hover:scale-110 transition-transform">
                  <tip.icon className="w-8 h-8 text-[#6C63FF]" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{tip.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed font-semibold">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'consultancy' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in">
            {/* Columna Lima Technology */}
            <div className="bg-gradient-to-br from-card-bg to-[#6C63FF]/5 border border-[#6C63FF]/30 rounded-[40px] p-10 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
               <div className="space-y-4">
                 <div className="text-[#6C63FF] text-[11px] font-black tracking-[0.3em] uppercase">Lima Technology</div>
                 <h2 className="text-4xl font-black text-white leading-tight uppercase tracking-tighter">
                   ¿Tu empresa necesita ayuda?
                 </h2>
                 <p className="text-text-muted text-lg font-semibold leading-relaxed">
                   Te ayudamos a proteger tu negocio digital. Auditorías, configuración segura y monitoreo continuo.
                 </p>
               </div>

               <div className="space-y-4">
                 {[
                   'Auditoría de seguridad digital',
                   'Monitoreo de filtraciones',
                   'Configuración segura de servicios',
                   'Capacitación para tu equipo'
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-3">
                     <CheckCircle2 className="w-5 h-5 text-status-green" />
                     <span className="text-[15px] font-bold text-white uppercase tracking-wide">{item}</span>
                   </div>
                 ))}
               </div>

               <a 
                 href="https://api.whatsapp.com/send/?phone=5493416139281&text=Hola%2C+quiero+asesoramiento%21&type=phone_number&app_absent=0" 
                 target="_blank"
                 rel="noopener noreferrer"
                 className="mt-4 bg-[#6C63FF] hover:bg-[#6C63FF]/90 text-white px-8 py-5 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(108,99,255,0.4)] transition-all hover:scale-[1.02] active:scale-95 group w-full"
               >
                 <MessageCircle className="w-6 h-6 fill-white" />
                 Escribinos por WhatsApp
               </a>

               <ShieldAlert className="absolute -bottom-10 -right-10 w-48 h-48 text-white/[0.03] -rotate-12" />
            </div>

            {/* Columna FAQ */}
            <div className="flex flex-col gap-6">
               <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Preguntas frecuentes</h3>
               <div className="flex flex-col gap-3">
                 {FAQS.map((faq, i) => (
                   <div key={i} className="border border-card-border rounded-2xl overflow-hidden bg-card-bg/30">
                     <button 
                       onClick={() => setOpenFaq(openFaq === i ? null : i)}
                       className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                     >
                       <span className="text-[14px] font-bold text-white uppercase tracking-tight">{faq.q}</span>
                       <ChevronDown className={`w-5 h-5 text-[#6C63FF] transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                     </button>
                     {openFaq === i && (
                       <div className="px-6 pb-6 animate-in">
                         <p className="text-[13px] text-text-muted font-semibold leading-relaxed pt-2 border-t border-card-border/50">
                           {faq.a}
                         </p>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
               
               <div className="mt-auto p-6 border border-card-border rounded-2xl flex items-center justify-between bg-card-bg/20">
                 <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">¿Tenés otra duda?</p>
                  <a 
                    href="https://limatechnology.com.ar" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#6C63FF] font-black text-[11px] uppercase tracking-widest hover:underline"
                  >
                    Ver más recursos <ExternalLink size={12} />
                  </a>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
