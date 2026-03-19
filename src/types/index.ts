export type ServiceStatus = 'online' | 'warning' | 'offline' | 'loading';

export interface Incident {
  title?: string;
  description?: string;
  status?: string;
  updatedAt?: string;
}

export interface Service {
  id: string;
  name: string;
  type: 'public' | 'proxy';
  endpoint?: string;
  displayUrl: string;
  status: ServiceStatus;
  latency?: number;
  latencyHistory: number[];
  lastUpdated?: string;
  history: number[];
  group: 'IA' | 'Mensajería' | 'Redes Sociales' | 'Infraestructura' | 'Streaming' | 'Juegos' | 'Telecomunicaciones' | 'Desarrollo';
  incident?: Incident;
  
  // Monitoring specific fields
  priority?: 'high' | 'medium' | 'low';
  lastFallback?: 'dns' | 'statusPage' | 'api' | 'homepage' | 'ping';
  consecutiveFailures?: number;
  lastCheckTimestamp?: number;
}


export interface DashboardData {
  services: Service[];
  lastUpdate: string;
}
