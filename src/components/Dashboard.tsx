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
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Dashboard() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const t = TRANSLATIONS[lang];

  const CATEGORY_TABS = [
    { id: 'all', label: t.all },
    { id: 'Redes Sociales', label: t.social },
    { id: 'Mensajería', label: t.messaging },
    { id: 'Juegos', label: t.games },
    { id: 'Streaming', label: t.streaming },
    { id: 'IA', label: t.ai },
    { id: 'Tecnología', label: t.tech },
  ];

  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [mounted, setMounted] = useState(false);
  const [activeCat, setActiveCat] = useState('all');
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'security'>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showToast, setShowToast] = useState(false);
  
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
          const apiStatus = data.services[s.id];
          if (apiStatus) {
            const historyValue = apiStatus === 'online' ? 1 : apiStatus === 'warning' ? 0.5 : 0;
            const latency = apiStatus === 'online' ? Math.floor(Math.random() * 80) + 20 : 0;
            return {
              ...s,
              status: apiStatus as any,
              latency,
              latencyHistory: updateServiceLatency(s, latency),
              history: [...s.history.slice(1), historyValue]
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

  useEffect(() => {
    setMounted(true);
    fetchStatus(false);
    
    const statusInterval = setInterval(() => fetchStatus(false), 60000);
    const syncInterval = setInterval(updateSyncTime, 10000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(syncInterval);
    };
  }, [lang]);

  const filteredServices = services.filter(s => {
    const matchesCat = activeCat === 'all' || s.group === activeCat;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.displayUrl.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const offlineCount = services.filter(s => s.status === 'offline').length;
  const warningCount = services.filter(s => s.status === 'warning').length;
  const issuesServices = services.filter(s => s.status === 'offline' || s.status === 'warning');

  const getSummaryHeader = () => {
    if (offlineCount > 0) return `${offlineCount} ${t.criticalIssues}`;
    if (warningCount > 0) return `${warningCount} ${t.someIssues}`;
    return t.allGood;
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
        <div className="flex items-center gap-2.5 animate-slide-left">
           <div className="w-9 h-9 rounded-xl border border-lima-green flex items-center justify-center bg-lima-green/5 shadow-[0_0_15px_rgba(184,245,0,0.1)]">
             <Server className="w-5 h-5 text-lima-green" />
           </div>
           <h1 className="text-2xl font-black tracking-tighter uppercase text-white">
             LimaUP<span className="text-lima-green">.</span>
           </h1>
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

                <div className="hidden sm:flex items-center gap-5">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.12em] flex items-center gap-2.5">
                     {offlineCount === 0 && warningCount === 0 && <CheckCircle2 className="w-4 h-4 text-status-green" />}
                     {getSummaryHeader()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => (activeMenu === 'dashboard' ? fetchStatus(true) : window.location.reload())}
                  disabled={isRefreshing}
                  className="p-3 rounded-xl border border-card-border bg-card-bg hover:border-it-blue/40 transition-all group active:scale-90 disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-4.5 h-4.5 text-text-muted group-hover:text-it-blue ${isRefreshing ? 'animate-spin text-it-blue' : ''}`} />
                </button>
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
            <span className="text-[11px] text-zinc-600 font-mono">
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

              {/* Banner de Problemas Activos - Slim */}
              {issuesServices.length > 0 && (
                <section 
                  className={`${
                    offlineCount > 0 ? 'bg-status-red/5 border-status-red/15' : 'bg-status-yellow/5 border-status-yellow/15'
                  } border rounded-xl px-4 h-10 flex items-center shadow-lg animate-in`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className={offlineCount > 0 ? 'text-status-red' : 'text-status-yellow'} />
                    <span className={`text-[11px] font-bold tracking-tight uppercase ${offlineCount > 0 ? 'text-status-red' : 'text-status-yellow'}`}>
                      {t.alertMsg} {issuesServices.map(s => s.name).join(", ")}
                    </span>
                  </div>
                </section>
              )}

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
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredServices.sort((a, b) => {
                  const priority: Record<string, number> = { offline: 0, warning: 1, online: 2, loading: 3 };
                  return (priority[a.status] ?? 2) - (priority[b.status] ?? 2);
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
            <div className="flex items-center gap-3 text-[11px] font-bold text-text-muted uppercase tracking-widest">
              <span>{t.createdBy}</span>
              <a href="https://limatechnology.com.ar" className="text-lima-green hover:text-white transition-all bg-lima-green/5 px-3 py-1 rounded-lg border border-lima-green/20 hover:border-lima-green/50">Lima Technology</a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
