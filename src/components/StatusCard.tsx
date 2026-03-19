"use client";

import { Service } from "@/types";
import { TRANSLATIONS, SECURITY_ALERTS } from "@/lib/constants";
import { AlertTriangle, Clock } from "lucide-react";

const getRelativeTime = (timeStr?: string, lang: 'es' | 'en' = 'es') => {
  if (!timeStr) return null;
  if (timeStr.toLowerCase().includes('hace') || timeStr.toLowerCase().includes('ago') || timeStr.toLowerCase().includes('just')) return timeStr;
  
  const date = new Date(timeStr);
  if (isNaN(date.getTime())) return timeStr;

  const diffMins = Math.floor((new Date().getTime() - date.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (lang === 'en') {
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    if (diffMins < 1) return 'Hace un instante';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
    return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
  }
};

interface Props {
  service: Service;
  isLoading?: boolean;
  lang: 'es' | 'en';
}

export function StatusCard({ service, isLoading: isGlobalLoading, lang }: Props) {
  const isOnline = service.status === 'online';
  const isWarning = service.status === 'warning';
  const isOffline = service.status === 'offline';
  const isLoading = service.status === 'loading' || isGlobalLoading;
  
  const t: any = TRANSLATIONS[lang];
  const securityAlert = SECURITY_ALERTS[service.id];

  const getStatusLabel = () => {
    if (isLoading) return t.checking;
    if (isOnline) return t.online; 
    if (isWarning) return t.degraded; 
    if (isOffline) return t.down; 
    return t.checking;
  };

  const pillStyles = isOnline 
    ? "text-status-green border-status-green/20" 
    : isWarning 
      ? "text-status-yellow border-status-yellow/20"
      : "text-status-red border-status-red/20";

  const dotColor = isOnline ? "bg-[#22c55e]" : isWarning ? "bg-[#f59e0b]" : "bg-[#ef4444]";

  const leftBorder = !isOnline 
    ? (isOffline ? "border-l-status-red" : "border-l-status-yellow") + " border-l-[3.5px]" 
    : "";

  const displayIncident = !isOnline;
  
  const getIncidentData = () => {
    if (service.incident) {
      const incStatus = service.incident.status || t.defaultIncidentStatus;
      let displayStatus = incStatus;
      
      if (lang === 'es') {
        const s = String(incStatus).toLowerCase();
        if (s.includes('monitor')) displayStatus = 'Monitoreando';
        else if (s.includes('investigat')) displayStatus = 'Investigando';
        else if (s.includes('identif')) displayStatus = 'Identificado';
        else if (s.includes('resolv')) displayStatus = 'Resuelto';
      }

      return {
        title: service.incident.title || t.defaultIncidentTitle,
        description: service.incident.description,
        status: displayStatus,
        updatedAt: service.incident.updatedAt
      };
    }
    
    return {
      title: t.defaultIncidentTitle,
      description: t.defaultIncidentDesc,
      status: t.defaultIncidentStatus
    };
  };

  const activeIncident = displayIncident ? getIncidentData() : null;

  return (
    <div
      className={`bg-card-bg border border-card-border p-5 rounded-2xl flex flex-col gap-4 relative group transition-all duration-300 hover:border-card-border-hover soft-shadow animate-in hover:-translate-y-1 ${leftBorder} ${isLoading ? 'animate-shimmer' : ''}`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-[#1a1a1a] border border-card-border rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 p-1">
            <img 
              src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${service.displayUrl
                .replace('health.aws.amazon.com', 'aws.amazon.com')
                .replace('vercel-status.com', 'vercel.com')
                .replace('cloudflarestatus.com', 'cloudflare.com')
                .replace('portal.app.flow.com.ar', 'www.flow.com.ar')
                .replace('idpsesion.personal.com.ar', 'www.personal.com.ar')
                .replace('api.personal.com.ar', 'www.personal.com.ar')
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

          <div className="min-w-0">
            <h3 className="text-[15px] font-bold text-text-main truncate leading-tight group-hover:text-white transition-colors">
              {service.name}
            </h3>
            <p className="text-[11px] text-text-muted mt-1.5 truncate tracking-wide">{service.displayUrl}</p>
          </div>
        </div>

        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border leading-none flex items-center gap-2 transition-all duration-300 ${pillStyles}`}>
          {isLoading ? (
            <Clock className="w-3.5 h-3.5 animate-spin opacity-50" />
          ) : (
            <div className="relative flex items-center justify-center w-2 h-2">
                <span className={`animate-radar absolute inline-flex w-full h-full rounded-full opacity-75 ${dotColor}`}></span>
                <span className={`relative inline-flex w-2 h-2 rounded-full ${dotColor}`}></span>
            </div>
          )}
          {getStatusLabel()}
        </div>
      </div>

      {activeIncident && (
        <div className="mx-0 mt-1 p-3 bg-status-yellow/10 border border-status-yellow/20 rounded-xl relative z-10 transition-all group-hover:bg-status-yellow/15">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-status-yellow shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-[12px] font-bold text-status-yellow leading-tight">
                {activeIncident.title}
              </p>
              {activeIncident.description && (
                <p className="text-[11px] text-zinc-400 leading-normal whitespace-pre-line">
                  {activeIncident.description}
                </p>
              )}
              {activeIncident.status && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {activeIncident.status}
                  </span>
                  {activeIncident.updatedAt && (
                    <span className="text-[11px] font-medium text-zinc-500">
                      • {getRelativeTime(activeIncident.updatedAt, lang)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7 Days History */}
      <div className="flex flex-col gap-1.5 mt-2 relative z-10">
        <div className="flex justify-between items-center px-1">
          <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">{lang === 'es' ? 'Hace 7 Días' : '7 Days Ago'}</span>
          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{lang === 'es' ? 'Hoy' : 'Today'}</span>
        </div>
        <div className="flex items-center gap-1.5 w-full h-1.5 px-0.5">
          {service.history.slice(-7).map((val, i) => {
            const historyColor = val === 1 ? 'bg-status-green' : val === 0.5 ? 'bg-status-yellow' : 'bg-status-red';
            const opacity = val === 1 ? 'opacity-30' : 'opacity-90'; 
            return (
              <div 
                key={i} 
                className={`flex-1 h-full rounded-full ${historyColor} ${opacity}`} 
                title={val === 1 ? t.online : val === 0.5 ? t.degraded : t.down}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-white/5 relative z-10 flex flex-col gap-2">
        {securityAlert ? (
          <div className="flex items-center gap-1.5 text-[#f59e0b] font-semibold text-[11px]">
             <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0" />
             <AlertTriangle className="w-3 h-3 text-[#f59e0b] shrink-0" />
             <span className="truncate">{securityAlert}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-500 font-semibold text-[11px]">
             <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" />
             <span className="truncate">{t.noIssues}</span>
          </div>
        )}
        
        {/* Monitoring metadata */}
        <div className="flex items-center justify-between opacity-40 group-hover:opacity-80 transition-opacity mt-1">
          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter">
            {service.lastFallback || 'ping'} check • {service.latency || 0}ms
          </span>
          {service.consecutiveFailures && service.consecutiveFailures > 0 ? (
            <span className="text-[8px] font-bold text-status-red uppercase tracking-tighter">
               ⚠️ {service.consecutiveFailures} hits
            </span>
          ) : null}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
    </div>
  );
}
