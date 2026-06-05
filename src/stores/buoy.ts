import { defineStore } from 'pinia';
import type { Buoy, Alert, AlertRule, WorkOrder, AlertType, AlertStatus, WorkOrderStatus } from '@/types';
import { generateInitialBuoys, updateBuoyData } from '@/utils/simulator';
import { v4 as uuidv4 } from 'uuid';
import { ref, computed } from 'vue';

const DEFAULT_RULES: AlertRule[] = [
  { id: uuidv4(), type: 'low_battery', name: '电池低电量告警', enabled: true, threshold: 20, unit: '%' },
  { id: uuidv4(), type: 'no_heartbeat', name: '心跳超时失联', enabled: true, threshold: 5, unit: '分钟' },
  { id: uuidv4(), type: 'wave_spike', name: '波高突变异常', enabled: true, threshold: 2.0, unit: 'm' },
];

function getRuleByType(rules: AlertRule[], type: AlertType): AlertRule | undefined {
  return rules.find(r => r.type === type && r.enabled);
}

function buildAlertKey(buoyId: string, type: AlertType): string {
  return `${buoyId}:${type}`;
}

export const useBuoyStore = defineStore('buoy', () => {
  const buoys = ref<Buoy[]>(generateInitialBuoys());
  const alerts = ref<Alert[]>([]);
  const rules = ref<AlertRule[]>(DEFAULT_RULES);
  const workOrders = ref<WorkOrder[]>([]);
  const selectedBuoyId = ref<string | null>(null);

  const selectedBuoy = computed(() => buoys.value.find(b => b.id === selectedBuoyId.value) || null);

  const activeAlerts = computed(() => alerts.value.filter(a => a.status !== 'closed'));

  function evaluateAlerts() {
    const now = Date.now();
    const activeAlertKeys = new Set(
      activeAlerts.value.map(a => buildAlertKey(a.buoyId, a.type))
    );
    const triggeredKeys = new Set<string>();

    for (const buoy of buoys.value) {
      const socRule = getRuleByType(rules.value, 'low_battery');
      if (socRule) {
        const lastSoc = buoy.powerHistory[buoy.powerHistory.length - 1]?.soc ?? 100;
        if (lastSoc < socRule.threshold) {
          const key = buildAlertKey(buoy.id, 'low_battery');
          triggeredKeys.add(key);
          processTrigger(key, buoy, 'low_battery', lastSoc, socRule.threshold, `电池电量 ${lastSoc.toFixed(1)}% 低于阈值 ${socRule.threshold}%`);
        }
      }

      const hbRule = getRuleByType(rules.value, 'no_heartbeat');
      if (hbRule) {
        const diffMs = now - buoy.lastHeartbeat;
        const diffMin = diffMs / 60000;
        if (diffMin > hbRule.threshold) {
          const key = buildAlertKey(buoy.id, 'no_heartbeat');
          triggeredKeys.add(key);
          processTrigger(key, buoy, 'no_heartbeat', diffMin, hbRule.threshold, `已 ${diffMin.toFixed(1)} 分钟未收到心跳`);
        }
      }

      const spikeRule = getRuleByType(rules.value, 'wave_spike');
      if (spikeRule && buoy.sensorHistory.length >= 2) {
        const last = buoy.sensorHistory[buoy.sensorHistory.length - 1];
        const prev = buoy.sensorHistory[buoy.sensorHistory.length - 2];
        const diff = Math.abs(last.waveHeight - prev.waveHeight);
        if (diff > spikeRule.threshold) {
          const key = buildAlertKey(buoy.id, 'wave_spike');
          triggeredKeys.add(key);
          processTrigger(key, buoy, 'wave_spike', diff, spikeRule.threshold, `波高突变 ${diff.toFixed(2)}m 超过阈值 ${spikeRule.threshold}m`);
        }
      }
    }

    for (const alert of alerts.value) {
      if (alert.status === 'closed') continue;
      const key = buildAlertKey(alert.buoyId, alert.type);
      if (!triggeredKeys.has(key)) {
        alert.status = 'closed';
        alert.lastUpdated = now;
      }
    }

    updateBuoyStatuses();
  }

  function processTrigger(
    key: string,
    buoy: Buoy,
    type: AlertType,
    value: number,
    threshold: number,
    message: string
  ) {
    const existing = activeAlerts.value.find(
      a => a.buoyId === buoy.id && a.type === type
    );
    if (existing) {
      existing.value = value;
      existing.threshold = threshold;
      existing.message = message;
      existing.lastUpdated = Date.now();
    } else {
      const now = Date.now();
      alerts.value.unshift({
        id: uuidv4(),
        buoyId: buoy.id,
        buoyName: buoy.name,
        type,
        message,
        status: 'pending',
        value,
        threshold,
        firstTriggered: now,
        lastUpdated: now,
      });
    }
  }

  function updateBuoyStatuses() {
    for (const buoy of buoys.value) {
      const hasActiveAlert = activeAlerts.value.some(
        a => a.buoyId === buoy.id && a.type !== 'no_heartbeat'
      );
      const hbAlert = activeAlerts.value.find(
        a => a.buoyId === buoy.id && a.type === 'no_heartbeat'
      );
      if (hbAlert) {
        buoy.status = 'offline';
      } else if (hasActiveAlert) {
        buoy.status = 'warning';
      } else {
        buoy.status = 'online';
      }
    }
  }

  function tick() {
    buoys.value = buoys.value.map(b => updateBuoyData(b));
    evaluateAlerts();
  }

  function updateAlertStatus(alertId: string, status: AlertStatus) {
    const alert = alerts.value.find(a => a.id === alertId);
    if (alert) {
      alert.status = status;
      alert.lastUpdated = Date.now();
    }
  }

  function updateRule(ruleId: string, patch: Partial<AlertRule>) {
    const rule = rules.value.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, patch);
    }
  }

  function createWorkOrder(
    buoyId: string,
    data: { assignee: string; plannedTime: number | null; description: string }
  ) {
    const buoy = buoys.value.find(b => b.id === buoyId);
    if (!buoy) return;
    const now = Date.now();
    workOrders.value.unshift({
      id: uuidv4(),
      buoyId,
      buoyName: buoy.name,
      assignee: data.assignee,
      plannedTime: data.plannedTime,
      status: 'pending',
      description: data.description,
      result: '',
      createdAt: now,
      updatedAt: now,
    });
  }

  function updateWorkOrder(
    orderId: string,
    patch: Partial<WorkOrder>
  ) {
    const order = workOrders.value.find(o => o.id === orderId);
    if (order) {
      Object.assign(order, patch);
      order.updatedAt = Date.now();
    }
  }

  return {
    buoys,
    alerts,
    rules,
    workOrders,
    selectedBuoyId,
    selectedBuoy,
    activeAlerts,
    tick,
    updateAlertStatus,
    updateRule,
    createWorkOrder,
    updateWorkOrder,
    evaluateAlerts,
  };
});
