export type ServiceStatus = 'online' | 'warning' | 'offline' | 'loading';

export interface Service {
  id: string;
  name: string;
  type: 'public' | 'proxy';
  endpoint?: string;
  displayUrl: string;
  status: ServiceStatus;
  latency?: number;
  latencyHistory: number[]; // Store recent latency points
  lastUpdated?: string;
  history: number[]; // 0 to 1 values for uptime
  group: 'IA' | 'Mensajería' | 'Redes Sociales' | 'Infraestructura' | 'Streaming' | 'Juegos' | 'Telecomunicaciones' | 'Desarrollo';
}

export interface DashboardData {
  services: Service[];
  lastUpdate: string;
}
