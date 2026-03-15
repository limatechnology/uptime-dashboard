"use client";

import { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import { INITIAL_SERVICES } from "@/lib/constants";

type Tab = "leaks" | "tips" | "consultancy";

const KNOWN_BREACHES: Record<string, { title: string, description: string, date: string, severity: "critical" | "high" | "medium" | "low", severityLevel: number }> = {
  facebook: {
    title: "Filtración masiva 2021",
    description: "533 millones de números de teléfono y datos personales expuestos",
    date: "Abril 2021",
    severity: "critical",
    severityLevel: 0
  },
  twitter: {
    title: "Filtración de emails 2022",
    description: "200 millones de emails expuestos en foro de hackers",
    date: "Enero 2023",
    severity: "high",
    severityLevel: 1
  },
  microsoft: {
    title: "Acceso no autorizado 2024",
    description: "Grupo Midnight Blizzard accedió a emails corporativos",
    date: "Enero 2024",
    severity: "high",
    severityLevel: 1
  },
  instagram: {
    title: "Scraping masivo 2021", 
    description: "Datos públicos de millones de perfiles recolectados",
    date: "2021",
    severity: "medium",
    severityLevel: 2
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
    const aLeak = KNOWN_BREACHES[a.id];
    const bLeak = KNOWN_BREACHES[b.id];
    const aLevel = aLeak ? aLeak.severityLevel : 4;
    const bLevel = bLeak ? bLeak.severityLevel : 4;
    return aLevel - bLevel;
  });

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-12">
      {/* Tabs Internas */}
      <div className="flex items-center gap-2 p-1 bg-background-main border border-card-border rounded-2xl w-fit">
        {[
          { id: 'leaks', label: lang === 'es' ? 'Filtraciones' : 'Breaches' },
          { id: 'tips', label: lang === 'es' ? 'Consejos' : 'Tips' },
          { id: 'consultancy', label: lang === 'es' ? 'Asesoría' : 'Consultancy' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
              ? 'bg-[#6C63FF] text-white shadow-[0_4px_15px_rgba(108,99,255,0.3)]' 
              : 'text-text-muted hover:text-white border border-transparent hover:border-[#6C63FF]/20'
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
            {sortedLeaks.map(service => {
              const breach = KNOWN_BREACHES[service.id];
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
                           <span className="text-[10px] font-bold opacity-50">{breach.date}</span>
                         </div>
                         
                         <p className="text-[11px] leading-relaxed font-semibold opacity-80">{breach.description}</p>
                       </div>
                    </div>
                  ) : (
                    <div className="pt-2 min-h-[80px] flex items-center">
                      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        No se han detectado incidentes de seguridad públicos asociados a este servicio.
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

        {activeTab === 'tips' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
            {SECURITY_TIPS.map((tip, idx) => (
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
