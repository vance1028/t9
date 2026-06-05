import type { Buoy, SensorReading, PowerReading } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const BUOY_BASE_DATA: Array<{ name: string; lat: number; lng: number }> = [
  { name: '浮标-01', lat: 31.2304, lng: 121.4737 },
  { name: '浮标-02', lat: 31.3504, lng: 121.5737 },
  { name: '浮标-03', lat: 31.1504, lng: 121.3737 },
  { name: '浮标-04', lat: 30.9804, lng: 121.8737 },
  { name: '浮标-05', lat: 31.5504, lng: 121.2737 },
];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateSensorReading(base?: SensorReading): SensorReading {
  const now = Date.now();
  return {
    timestamp: now,
    waveHeight: base
      ? Math.max(0, base.waveHeight + randomInRange(-0.3, 0.3))
      : randomInRange(0.5, 3.5),
    flowVelocity: base
      ? Math.max(0, base.flowVelocity + randomInRange(-0.2, 0.2))
      : randomInRange(0.2, 2.5),
    waterTemp: base
      ? base.waterTemp + randomInRange(-0.3, 0.3)
      : randomInRange(15, 28),
    salinity: base
      ? Math.max(0, base.salinity + randomInRange(-0.5, 0.5))
      : randomInRange(28, 35),
  };
}

function generatePowerReading(base?: PowerReading): PowerReading {
  const now = Date.now();
  const power = randomInRange(5, 80);
  let soc = base ? base.soc : randomInRange(30, 100);
  const delta = power > 30 ? randomInRange(0, 0.5) : randomInRange(-0.8, -0.1);
  soc = Math.max(0, Math.min(100, soc + delta));
  return { timestamp: now, power, soc };
}

export function generateInitialBuoys(): Buoy[] {
  const now = Date.now();
  return BUOY_BASE_DATA.map((base, idx) => {
    const sensorHistory: SensorReading[] = [];
    const powerHistory: PowerReading[] = [];
    let sensor: SensorReading | undefined;
    let power: PowerReading | undefined;
    for (let i = 59; i >= 0; i--) {
      sensor = generateSensorReading(sensor);
      sensor.timestamp = now - i * 60000;
      sensorHistory.push(sensor);
      power = generatePowerReading(power);
      power.timestamp = now - i * 60000;
      powerHistory.push(power);
    }
    return {
      id: uuidv4(),
      name: base.name,
      lat: base.lat,
      lng: base.lng,
      status: 'online',
      lastHeartbeat: now - idx * 5000,
      sensorHistory,
      powerHistory,
    };
  });
}

export function updateBuoyData(buoy: Buoy, offlineChance = 0.02, spikeChance = 0.05): Buoy {
  const now = Date.now();
  if (buoy.status === 'offline' && Math.random() < 0.1) {
    return {
      ...buoy,
      status: 'online',
      lastHeartbeat: now,
    };
  }
  if (buoy.status === 'online' && Math.random() < offlineChance) {
    return { ...buoy, status: 'offline' };
  }
  const lastSensor = buoy.sensorHistory[buoy.sensorHistory.length - 1];
  const lastPower = buoy.powerHistory[buoy.powerHistory.length - 1];
  let newSensor = generateSensorReading(lastSensor);
  if (Math.random() < spikeChance) {
    newSensor.waveHeight = newSensor.waveHeight * randomInRange(2.5, 4);
  }
  const newPower = generatePowerReading(lastPower);
  const sensorHistory = [...buoy.sensorHistory.slice(-59), newSensor];
  const powerHistory = [...buoy.powerHistory.slice(-59), newPower];
  return {
    ...buoy,
    status: buoy.status === 'offline' ? 'offline' : 'online',
    lastHeartbeat: buoy.status === 'offline' ? buoy.lastHeartbeat : now,
    sensorHistory,
    powerHistory,
  };
}
