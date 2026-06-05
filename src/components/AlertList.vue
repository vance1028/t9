<template>
  <div>
    <div class="section-header">
      <span class="section-title">告警列表 ({{ store.alerts.length }})</span>
      <el-select v-model="filterStatus" size="small" style="width: 120px;">
        <el-option label="全部" value="" />
        <el-option label="待处理" value="pending" />
        <el-option label="已确认" value="acknowledged" />
        <el-option label="处理中" value="processing" />
        <el-option label="已关闭" value="closed" />
      </el-select>
    </div>

    <div v-if="filteredAlerts.length === 0" class="empty-state">
      暂无告警
    </div>

    <div v-for="alert in filteredAlerts" :key="alert.id" class="alert-item">
      <div class="alert-item-header">
        <span class="alert-item-title">{{ alert.buoyName }} - {{ typeText(alert.type) }}</span>
        <span class="alert-badge" :class="alert.status">{{ statusText(alert.status) }}</span>
      </div>
      <div class="alert-item-message">{{ alert.message }}</div>
      <div class="alert-item-meta">
        <span>首次触发: {{ formatTime(alert.firstTriggered) }}</span>
        <span>最近更新: {{ formatTime(alert.lastUpdated) }}</span>
      </div>
      <div class="alert-item-actions" v-if="alert.status !== 'closed'">
        <el-button size="small" @click="updateStatus(alert.id, 'acknowledged')" :disabled="alert.status === 'acknowledged'">
          确认
        </el-button>
        <el-button size="small" type="primary" @click="updateStatus(alert.id, 'processing')" :disabled="alert.status === 'processing'">
          处理中
        </el-button>
        <el-button size="small" type="success" @click="updateStatus(alert.id, 'closed')">
          关闭
        </el-button>
        <el-button size="small" @click="viewBuoy(alert.buoyId)">
          查看浮标
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useBuoyStore } from '@/stores/buoy';
import dayjs from 'dayjs';
import type { AlertType, AlertStatus } from '@/types';

const store = useBuoyStore();
const filterStatus = ref<AlertStatus | ''>('');

const filteredAlerts = computed(() => {
  if (!filterStatus.value) return store.alerts;
  return store.alerts.filter(a => a.status === filterStatus.value);
});

function typeText(type: AlertType): string {
  switch (type) {
    case 'low_battery': return '低电量告警';
    case 'no_heartbeat': return '心跳失联';
    case 'wave_spike': return '波高突变';
  }
}

function statusText(status: AlertStatus): string {
  switch (status) {
    case 'pending': return '待处理';
    case 'acknowledged': return '已确认';
    case 'processing': return '处理中';
    case 'closed': return '已关闭';
  }
}

function formatTime(ts: number): string {
  return dayjs(ts).format('MM-DD HH:mm:ss');
}

function updateStatus(alertId: string, status: AlertStatus) {
  store.updateAlertStatus(alertId, status);
}

function viewBuoy(buoyId: string) {
  store.selectedBuoyId = buoyId;
}
</script>
