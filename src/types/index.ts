export type BuoyStatus = 'online' | 'warning' | 'offline';

export interface SensorReading {
  timestamp: number;
  waveHeight: number;
  flowVelocity: number;
  waterTemp: number;
  salinity: number;
}

export interface PowerReading {
  timestamp: number;
  power: number;
  soc: number;
}

export interface Buoy {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: BuoyStatus;
  lastHeartbeat: number;
  sensorHistory: SensorReading[];
  powerHistory: PowerReading[];
}

export type AlertType = 'low_battery' | 'no_heartbeat' | 'wave_spike';

export type AlertStatus = 'pending' | 'acknowledged' | 'processing' | 'closed';

export interface Alert {
  id: string;
  buoyId: string;
  buoyName: string;
  type: AlertType;
  message: string;
  status: AlertStatus;
  value: number;
  threshold: number;
  firstTriggered: number;
  lastUpdated: number;
}

export interface AlertRule {
  id: string;
  type: AlertType;
  name: string;
  enabled: boolean;
  threshold: number;
  unit: string;
}

export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed';

export interface WorkOrder {
  id: string;
  buoyId: string;
  buoyName: string;
  assignee: string;
  plannedTime: number | null;
  status: WorkOrderStatus;
  description: string;
  result: string;
  createdAt: number;
  updatedAt: number;
}
