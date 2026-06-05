<template>
  <div class="app-container">
    <header class="app-header">
      <h1>🌊 近海观测浮标监控系统</h1>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-dot online"></span>
          <span>在线: {{ onlineCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot warning"></span>
          <span>告警: {{ warningCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot offline"></span>
          <span>失联: {{ offlineCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot alert"></span>
          <span>活跃告警: {{ store.activeAlerts.length }}</span>
        </div>
      </div>
    </header>

    <main class="app-main">
      <MapView />
      <aside class="side-panel">
        <div class="panel-tabs">
          <div
            class="panel-tab"
            :class="{ active: activeTab === 'detail' }"
            @click="activeTab = 'detail'"
          >
            浮标详情
          </div>
          <div
            class="panel-tab"
            :class="{ active: activeTab === 'alerts' }"
            @click="activeTab = 'alerts'"
          >
            告警列表
          </div>
          <div
            class="panel-tab"
            :class="{ active: activeTab === 'rules' }"
            @click="activeTab = 'rules'"
          >
            告警规则
          </div>
          <div
            class="panel-tab"
            :class="{ active: activeTab === 'workorders' }"
            @click="activeTab = 'workorders'"
          >
            维护工单
          </div>
        </div>
        <div class="panel-content">
          <BuoyDetail v-if="activeTab === 'detail'" />
          <AlertList v-if="activeTab === 'alerts'" />
          <RuleConfig v-if="activeTab === 'rules'" />
          <WorkOrderList v-if="activeTab === 'workorders'" />
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import MapView from '@/components/MapView.vue';
import BuoyDetail from '@/components/BuoyDetail.vue';
import AlertList from '@/components/AlertList.vue';
import RuleConfig from '@/components/RuleConfig.vue';
import WorkOrderList from '@/components/WorkOrderList.vue';
import { useBuoyStore } from '@/stores/buoy';

const store = useBuoyStore();
const activeTab = ref('detail');

const onlineCount = computed(() => store.buoys.filter(b => b.status === 'online').length);
const warningCount = computed(() => store.buoys.filter(b => b.status === 'warning').length);
const offlineCount = computed(() => store.buoys.filter(b => b.status === 'offline').length);

let timer: number | null = null;

onMounted(() => {
  store.evaluateAlerts();
  timer = window.setInterval(() => {
    store.tick();
  }, 2000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>
