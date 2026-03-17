"use client";

import { Service } from "@/types";
import { TRANSLATIONS, SECURITY_ALERTS } from "@/lib/constants";
import { AlertTriangle, Clock } from "lucide-react";

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
  
  const t = TRANSLATIONS[lang];
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

      {service.incident && (
        <div className="mx-0 mt-1 p-3 bg-status-yellow/10 border border-status-yellow/20 rounded-xl relative z-10 transition-all group-hover:bg-status-yellow/15">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-status-yellow shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-[12px] font-bold text-status-yellow leading-tight">
                {service.incident.title}
              </p>
              {service.incident.description && (
                <p className="text-[11px] text-zinc-400 leading-normal">
                  {service.incident.description}
                </p>
              )}
              {service.incident.status && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {service.incident.status}
                  </span>
                  {service.incident.updatedAt && (
                    <span className="text-[10px] text-zinc-600">
                      • {service.incident.updatedAt}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto pt-2 border-t border-white/5 relative z-10">
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
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
    </div>
  );
}
