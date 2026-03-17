"use client";

import { useState, useEffect, useRef } from "react";
import { Service } from "@/types";
import { INITIAL_SERVICES, TRANSLATIONS } from "@/lib/constants";
import { StatusCard } from "./StatusCard";
import { SecurityPage } from "./SecurityPage";
import { 
  Search, 
  RefreshCw, 
  Languages, 
  AlertTriangle,
  LayoutGrid, 
  ShieldAlert, 
  Server,
  Activity,
  CheckCircle2,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Dashboard() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const t = TRANSLATIONS[lang];

  const CATEGORY_TABS = [
    { id: 'popular', label: t.popular },
    { id: 'all', label: t.all },
    { id: 'Telecomunicaciones', label: t.telecom },
    { id: 'Desarrollo', label: t.dev },
    { id: 'Redes Sociales', label: t.social },
    { id: 'Mensajería', label: t.messaging },
    { id: 'Juegos', label: t.games },
    { id: 'Streaming', label: t.streaming },
    { id: 'Infraestructura', label: t.infra },
    { id: 'IA', label: t.ai },
  ];

  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [mounted, setMounted] = useState(false);
  const POPULAR_SERVICES = [
    'whatsapp', 'instagram', 'youtube', 'gmail', 'discord', 'twitter', 'twitch', 
    'openai', 'telegram', 'steam', 'movistar', 'personal', 'claro', 'flow'
  ];

  const [activeCat, setActiveCat] = useState('popular');
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'security'>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const lastFetchTime = useRef(Date.now());
  const [lastSyncAgo, setLastSyncAgo] = useState("");

  const updateServiceLatency = (s: Service, latency: number) => {
    const history = [...(s.latencyHistory || Array(10).fill(25))];
    history.push(latency);
    if (history.length > 10) history.shift();
    return history;
  };

  const fetchStatus = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
      setIsLoading(true);
    }
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      
      if (data.success && data.services) {
        setServices(prev => prev.map(s => {
          const apiData = data.services[s.id];
          if (apiData) {
            const apiStatus = typeof apiData === 'string' ? apiData : apiData.status;
            const apiIncident = typeof apiData === 'object' ? apiData.incident : undefined;
            const historyValue = apiStatus === 'online' ? 1 : apiStatus === 'warning' ? 0.5 : 0;
            const latency = apiStatus === 'online' ? Math.floor(Math.random() * 80) + 20 : 0;
            return {
              ...s,
              status: apiStatus as any,
              latency,
              latencyHistory: updateServiceLatency(s, latency),
              history: [...s.history.slice(1), historyValue],
              incident: apiStatus === 'online' ? undefined : (apiIncident || undefined)
            };
          }
          return s;
        }));
        lastFetchTime.current = Date.now();
        updateSyncTime();
        
        if (isManual) {
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      }
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      if (isManual) {
        setTimeout(() => {
          setIsRefreshing(false);
          setIsLoading(false);
        }, 800);
      }
    }
  };

  const updateSyncTime = () => {
    const diff = Math.floor((Date.now() - lastFetchTime.current) / 1000);
    if (diff < 60) {
      setLastSyncAgo(`${t.lastUpdated} ${diff} ${t.seconds}`);
    } else {
      setLastSyncAgo(`${t.lastUpdated} ${Math.floor(diff / 60)} ${t.minutes}`);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/security-news');
      const data = await response.json();
      if (data.articles) {
        setNotifications(data.articles.slice(0, 5));
        setHasNewNotifications(true);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchStatus(false);
    fetchNotifications();
    
    const statusInterval = setInterval(() => fetchStatus(false), 300000); // 5 minutes
    const syncInterval = setInterval(updateSyncTime, 10000);
    const notificationsInterval = setInterval(fetchNotifications, 3600000); // 1 hour
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(syncInterval);
      clearInterval(notificationsInterval);
    };
  }, [lang]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredServices = services.filter(s => {
    const matchesCat = activeCat === 'all' || 
                       (activeCat === 'popular' ? POPULAR_SERVICES.includes(s.id) : s.group === activeCat);
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.displayUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const offlineCount = services.filter(s => s.status === 'offline').length;
  const warningCount = services.filter(s => s.status === 'warning').length;
  const issuesServices = services.filter(s => s.status === 'offline' || s.status === 'warning');



  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeMenu === 'dashboard') {
      await fetchStatus(true);
    } else {
      await fetchNotifications();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      window.dispatchEvent(new CustomEvent('refresh-security'));
      // Simulamos carga para que se vea la animación
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background-main text-text-main font-plus flex font-normal">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#1a1d27] border border-[#22c55e]/30 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl"
          >
            <CheckCircle2 size={14} className="text-[#22c55e]" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">{lang === 'es' ? 'Actualizado' : 'Updated'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Menú */}
      <aside className="w-68 border-r border-card-border bg-background-main hidden lg:flex flex-col p-7 gap-9 sticky top-0 h-screen overflow-hidden">
        <div className="flex animate-slide-left mb-2">
           <svg width="180" height="52" viewBox="0 0 180 52" fill="none" xmlns="http://www.w3.org/2000/svg">
             <rect width="180" height="52" rx="14" fill="#101010"/>
             <rect x="10" y="8" width="36" height="36" rx="9" fill="#1a1a1a" stroke="#B8F500" strokeWidth="1.2"/>
             <circle cx="28" cy="26" r="11" fill="none" stroke="#B8F500" strokeWidth="1.4"/>
             <line x1="28" y1="15" x2="28" y2="37" stroke="#B8F500" strokeWidth="1"/>
             <line x1="17" y1="26" x2="39" y2="26" stroke="#B8F500" strokeWidth="1"/>
             <line x1="20" y1="18" x2="36" y2="34" stroke="#B8F500" strokeWidth="1"/>
             <line x1="20" y1="34" x2="36" y2="18" stroke="#B8F500" strokeWidth="1"/>
             <text x="58" y="32" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="15" fontWeight="700" fill="white" letterSpacing="1.5">LIMA</text>
             <text x="103" y="32" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="15" fontWeight="700" fill="#B8F500" letterSpacing="1">UP</text>
             <circle cx="128" cy="32" r="2.5" fill="#B8F500" opacity="0.9"/>
             <line x1="57" y1="38" x2="134" y2="38" stroke="#B8F500" strokeWidth="0.4" opacity="0.25"/>
           </svg>
        </div>

        <nav className="flex flex-col gap-2.5">
          {[
            { id: 'dashboard', label: t.dashboard, icon: LayoutGrid, activeColor: 'text-it-blue', activeBorder: 'border-it-blue/40' },
            { id: 'security', label: t.security, icon: ShieldAlert, activeColor: 'text-cyber-purple', activeBorder: 'border-cyber-purple/40' },
          ].map((item, idx) => (
            <button
              key={item.id}
              style={{ animationDelay: `${idx * 0.1}s` }}
              onClick={() => setActiveMenu(item.id as any)}
              className={`flex items-center gap-3.5 px-5 py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border animate-slide-left ${
                activeMenu === item.id 
                ? `bg-white/5 ${item.activeColor} ${item.activeBorder}` 
                : 'text-text-muted hover:text-white hover:bg-white/5 border-white/8'
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-7 border-t border-card-border/40">
           <button 
             onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
             className="flex items-center gap-3.5 px-5 py-3 rounded-xl border border-white/8 hover:bg-white/5 transition-all w-full text-text-muted hover:text-white hover:border-it-blue/40"
           >
              <Languages className="w-4.5 h-4.5" />
              <span className="text-[11px] font-bold uppercase tracking-widest">
                {lang === 'es' ? 'English' : 'Español'}
              </span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-h-screen overflow-x-hidden">
        <header className="bg-background-main/80 backdrop-blur-md border-b border-card-border sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-10 pt-8 pb-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 lg:hidden">
                <h1 className="text-2xl font-black tracking-tight text-text-main">LimaUP<span className="text-lima-green">.</span></h1>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2.5 px-3 py-1.5 bg-card-bg/40 border border-card-border rounded-full shadow-lg">
                  <div className="relative flex items-center justify-center w-2 h-2">
                    <span className="animate-radar absolute inline-flex w-full h-full rounded-full bg-lima-green/40 opacity-0"></span>
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-lima-green"></span>
                  </div>
                  <span className="text-[9px] font-black text-lima-green uppercase tracking-[0.2em] leading-none">
                    {t.liveLabel}
                  </span>
                </div>

                <div className="hidden sm:flex items-center">
                  <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border transition-colors ${
                    issuesServices.length === 0 
                      ? 'bg-status-green/5 border-status-green/10' 
                      : offlineCount > 0 
                        ? 'bg-status-red/5 border-status-red/15' 
                        : 'bg-status-yellow/5 border-status-yellow/15'
                  }`}>
                    {issuesServices.length === 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-status-green" />
                    ) : (
                      <AlertTriangle className={`w-4 h-4 ${offlineCount > 0 ? 'text-status-red' : 'text-status-yellow'}`} />
                    )}
                    <span className={`text-[10px] font-bold uppercase tracking-wider truncate max-w-[500px] mt-[1px] ${
                      issuesServices.length === 0 
                        ? 'text-text-muted text-[11px]' 
                        : offlineCount > 0 
                          ? 'text-status-red' 
                          : 'text-status-yellow'
                    }`}>
                      {issuesServices.length === 0 
                        ? (lang === 'es' ? 'Servicios funcionando correctamente' : 'Services operating normally') 
                        : `${lang === 'es' ? 'Hay problemas en' : 'Issues on'}: ${issuesServices.map(s => s.name.toUpperCase()).join(", ")}`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-3 rounded-xl border border-card-border bg-card-bg hover:border-it-blue/40 transition-all group active:scale-90 disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-4.5 h-4.5 text-text-muted group-hover:text-it-blue ${isRefreshing ? 'animate-spin text-it-blue' : ''}`} />
                </button>

                <div className="relative" ref={notificationsRef}>
                  <button 
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setHasNewNotifications(false);
                    }}
                    className="p-3 rounded-xl border border-card-border bg-card-bg hover:border-cyber-purple/40 transition-all group active:scale-90 shadow-sm relative"
                  >
                    <Bell className={`w-4.5 h-4.5 text-text-muted group-hover:text-cyber-purple ${hasNewNotifications ? 'animate-pulse text-cyber-purple' : ''}`} />
                    {hasNewNotifications && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-cyber-purple rounded-full border-2 border-card-bg"></span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-card-bg border border-card-border rounded-2xl shadow-2xl z-[60] overflow-hidden"
                      >
                        <div className="p-4 border-b border-card-border bg-white/5 flex items-center justify-between">
                          <h3 className="text-[11px] font-black uppercase tracking-widest text-white">
                            {lang === 'es' ? 'Últimas Alertas' : 'Recent Alerts'}
                          </h3>
                          <span className="bg-cyber-purple/20 text-cyber-purple text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {notifications.length}
                          </span>
                        </div>
                        <div className="max-h-96 overflow-y-auto no-scrollbar">
                          {notifications.length > 0 ? (
                            notifications.map((n, i) => (
                              <a 
                                key={i}
                                href={n.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 border-b border-card-border/50 hover:bg-white/[0.03] transition-colors group"
                              >
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                      n.category === 'breach' ? 'bg-status-red/20 text-status-red' : 
                                      n.category === 'vulnerability' ? 'bg-status-orange/20 text-status-orange' : 
                                      'bg-it-blue/20 text-it-blue'
                                    }`}>
                                      {n.category}
                                    </span>
                                    <span className="text-[9px] text-text-muted font-medium">
                                      {new Date(n.publishedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <h4 className="text-[11px] font-bold text-white group-hover:text-cyber-purple transition-colors line-clamp-2">
                                    {n.title}
                                  </h4>
                                  <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2 italic">
                                    {n.source}
                                  </p>
                                </div>
                              </a>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <p className="text-[11px] text-text-muted font-medium">
                                {lang === 'es' ? 'No hay alertas recientes' : 'No recent alerts'}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-white/5 text-center">
                          <button 
                            onClick={() => setActiveMenu('security')}
                            className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-white transition-colors"
                          >
                            {lang === 'es' ? 'Ver todo el centro de seguridad' : 'View full security center'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {activeMenu === 'dashboard' ? (
              <div className="flex flex-col gap-4 animate-in">
                <div className="flex items-center gap-4">
                   <div className="bg-[#0078D4]/10 p-3 rounded-2xl border border-[#0078D4]/20 shadow-[0_0_20px_rgba(0,120,212,0.1)]">
                     <Activity className="w-6 h-6 text-[#0078D4]" />
                   </div>
                   <h1 className="text-4xl font-black tracking-tight text-white uppercase">
                     {t.dashboard}
                   </h1>
                </div>
                <p className="text-text-muted text-[15px] font-semibold tracking-wide">
                  {t.servicesSubtitle}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 animate-in">
                <div className="flex items-center gap-4">
                  <div className="bg-[#6C63FF]/10 p-3 rounded-2xl border border-[#6C63FF]/20 shadow-[0_0_20px_rgba(108,99,255,0.1)]">
                    <ShieldAlert className="w-6 h-6 text-[#6C63FF]" />
                  </div>
                  <h1 className="text-4xl font-black tracking-tight text-white uppercase">
                    {lang === 'es' ? 'Centro de Seguridad' : 'Security Center'}
                  </h1>
                </div>
                <p className="text-text-muted text-[15px] font-semibold tracking-wide">
                  {lang === 'es' ? 'Filtraciones, alertas y consejos para protegerte' : 'Breaches, alerts and tips to protect yourself'}
                </p>
              </div>
            )}
          </div>
        </header>

        {/* Update Bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-10 bg-background-main">
          <div className="flex items-center px-0 py-2 border-b border-white/5 mb-6">
            <div className="flex-1" />
            <span className="text-[12px] text-zinc-400 font-medium font-mono tracking-wide">
              {lastSyncAgo}
            </span>
          </div>
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-10 pb-10 flex flex-col gap-8">
          
          {activeMenu === 'dashboard' ? (
            <div className="flex flex-col gap-8">
              {/* Buscador - Reubicado */}
              <div className="relative group flex items-center w-full max-w-2xl animate-in">
                <Search className="absolute left-5 w-4.5 h-4.5 text-text-muted group-focus-within:text-it-blue transition-colors duration-300" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="bg-card-bg/50 border border-card-border rounded-2xl py-4 pl-14 pr-8 text-[15px] font-semibold w-full outline-none focus:bg-card-bg focus:border-it-blue/50 soft-shadow transition-all duration-300 text-text-main placeholder:text-text-muted/40"
                />
              </div>



              {/* Tabs de Categorías - Compact */}
              <nav 
                className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 animate-in h-9"
              >
                {CATEGORY_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCat(tab.id)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.05em] transition-all whitespace-nowrap border ${
                      activeCat === tab.id 
                      ? 'bg-it-blue text-white border-it-blue' 
                      : 'bg-card-bg text-text-muted hover:text-white border-card-border hover:border-it-blue/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {/* Grid de Servicios */}
              <section 
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-start"
              >
                {filteredServices.sort((a, b) => {
                  const statusPriority: Record<string, number> = { offline: 0, warning: 1, online: 2, loading: 3 };
                  const sA = statusPriority[a.status] ?? 2;
                  const sB = statusPriority[b.status] ?? 2;

                  if (sA !== sB) return sA - sB;

                  // Prioridad manual solicitada
                  const pA = POPULAR_SERVICES.indexOf(a.id);
                  const pB = POPULAR_SERVICES.indexOf(b.id);

                  if (pA !== -1 && pB !== -1) return pA - pB;
                  if (pA !== -1) return -1;
                  if (pB !== -1) return 1;

                  return 0;
                }).map((s) => (
                  <StatusCard key={s.id} service={s} isLoading={isLoading} lang={lang} />
                ))}
              </section>
            </div>
          ) : (
            <SecurityPage lang={lang} />
          )}

          {/* Footer Minimalista */}
          <footer className="mt-auto py-16 flex flex-col items-center justify-center gap-4 border-t border-card-border/40">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] text-center px-4 leading-relaxed">
              {t.footer}
            </p>
            <div className="flex items-center gap-2 text-[12px] font-medium text-text-muted transition-colors">
              <span>{t.createdBy}</span>
              <span className="text-red-500">❤️</span>
              <span className="lowercase">por</span>
              <a href="https://limatechnology.com.ar" className="text-lima-green hover:text-white transition-all bg-lima-green/5 px-3 py-1 rounded-lg border border-lima-green/20 hover:border-lima-green/50 font-bold ml-1">Lima Technology</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
