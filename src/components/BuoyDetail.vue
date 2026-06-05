<template>
  <div v-if="buoy">
    <div class="section-header">
      <span class="section-title">{{ buoy.name }}</span>
      <span class="status-badge" :class="buoy.status">
        {{ statusText }}
      </span>
    </div>

    <div class="detail-section">
      <h3>基本信息</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">经纬度</div>
          <div class="detail-value">{{ buoy.lat.toFixed(4) }}, {{ buoy.lng.toFixed(4) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">最后心跳</div>
          <div class="detail-value">{{ formatTime(buoy.lastHeartbeat) }}</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>实时数据</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">波高</div>
          <div class="detail-value">{{ lastSensor?.waveHeight.toFixed(2) }} m</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">流速</div>
          <div class="detail-value">{{ lastSensor?.flowVelocity.toFixed(2) }} m/s</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">水温</div>
          <div class="detail-value">{{ lastSensor?.waterTemp.toFixed(1) }} °C</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">盐度</div>
          <div class="detail-value">{{ lastSensor?.salinity.toFixed(1) }} psu</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>波浪能与电池</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">发电功率</div>
          <div class="detail-value">{{ lastPower?.power.toFixed(1) }} W</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">电池 SOC</div>
          <div class="detail-value">{{ lastPower?.soc.toFixed(1) }} %</div>
        </div>
      </div>
    </div>

    <div class="detail-section">
      <h3>波高曲线</h3>
      <div class="chart-container" ref="waveChart"></div>
    </div>

    <div class="detail-section">
      <h3>流速曲线</h3>
      <div class="chart-container" ref="flowChart"></div>
    </div>

    <div class="detail-section">
      <h3>水温 & 盐度</h3>
      <div class="chart-container" ref="tempChart"></div>
    </div>

    <div class="detail-section">
      <h3>发电功率 & 电池SOC</h3>
      <div class="chart-container" ref="powerChart"></div>
    </div>
  </div>
  <div v-else class="empty-state">
    请在地图上点击浮标查看详情
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { useBuoyStore } from '@/stores/buoy';
import dayjs from 'dayjs';

const store = useBuoyStore();

const waveChart = ref<HTMLDivElement | null>(null);
const flowChart = ref<HTMLDivElement | null>(null);
const tempChart = ref<HTMLDivElement | null>(null);
const powerChart = ref<HTMLDivElement | null>(null);

let waveChartInst: echarts.ECharts | null = null;
let flowChartInst: echarts.ECharts | null = null;
let tempChartInst: echarts.ECharts | null = null;
let powerChartInst: echarts.ECharts | null = null;

const buoy = computed(() => store.selectedBuoy);

const lastSensor = computed(() => {
  if (!buoy.value || buoy.value.sensorHistory.length === 0) return null;
  return buoy.value.sensorHistory[buoy.value.sensorHistory.length - 1];
});

const lastPower = computed(() => {
  if (!buoy.value || buoy.value.powerHistory.length === 0) return null;
  return buoy.value.powerHistory[buoy.value.powerHistory.length - 1];
});

const statusText = computed(() => {
  if (!buoy.value) return '';
  switch (buoy.value.status) {
    case 'online': return '在线';
    case 'warning': return '告警';
    case 'offline': return '失联';
  }
});

function formatTime(ts: number): string {
  return dayjs(ts).format('HH:mm:ss');
}

function initCharts() {
  if (waveChart.value) waveChartInst = echarts.init(waveChart.value);
  if (flowChart.value) flowChartInst = echarts.init(flowChart.value);
  if (tempChart.value) tempChartInst = echarts.init(tempChart.value);
  if (powerChart.value) powerChartInst = echarts.init(powerChart.value);
}

function updateCharts() {
  if (!buoy.value) return;
  const times = buoy.value.sensorHistory.map(s => dayjs(s.timestamp).format('HH:mm'));

  if (waveChartInst) {
    waveChartInst.setOption({
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: 'm', nameTextStyle: { fontSize: 10 } },
      series: [{
        type: 'line',
        smooth: true,
        data: buoy.value.sensorHistory.map(s => s.waveHeight),
        lineStyle: { color: '#1890ff', width: 2 },
        areaStyle: { color: 'rgba(24,144,255,0.1)' },
        symbol: 'none'
      }],
      tooltip: { trigger: 'axis' }
    });
  }

  if (flowChartInst) {
    flowChartInst.setOption({
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: 'm/s', nameTextStyle: { fontSize: 10 } },
      series: [{
        type: 'line',
        smooth: true,
        data: buoy.value.sensorHistory.map(s => s.flowVelocity),
        lineStyle: { color: '#52c41a', width: 2 },
        areaStyle: { color: 'rgba(82,196,26,0.1)' },
        symbol: 'none'
      }],
      tooltip: { trigger: 'axis' }
    });
  }

  if (tempChartInst) {
    tempChartInst.setOption({
      grid: { left: 50, right: 50, top: 20, bottom: 30 },
      legend: { data: ['水温', '盐度'], top: 0 },
      xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10 } },
      yAxis: [
        { type: 'value', name: '°C', nameTextStyle: { fontSize: 10 }, position: 'left' },
        { type: 'value', name: 'psu', nameTextStyle: { fontSize: 10 }, position: 'right' }
      ],
      series: [
        {
          name: '水温',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          data: buoy.value.sensorHistory.map(s => s.waterTemp),
          lineStyle: { color: '#fa8c16', width: 2 },
          symbol: 'none'
        },
        {
          name: '盐度',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: buoy.value.sensorHistory.map(s => s.salinity),
          lineStyle: { color: '#722ed1', width: 2 },
          symbol: 'none'
        }
      ],
      tooltip: { trigger: 'axis' }
    });
  }

  if (powerChartInst) {
    powerChartInst.setOption({
      grid: { left: 50, right: 50, top: 20, bottom: 30 },
      legend: { data: ['发电功率', '电池SOC'], top: 0 },
      xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10 } },
      yAxis: [
        { type: 'value', name: 'W', nameTextStyle: { fontSize: 10 }, position: 'left' },
        { type: 'value', name: '%', nameTextStyle: { fontSize: 10 }, position: 'right', min: 0, max: 100 }
      ],
      series: [
        {
          name: '发电功率',
          type: 'line',
          smooth: true,
          yAxisIndex: 0,
          data: buoy.value.powerHistory.map(p => p.power),
          lineStyle: { color: '#13c2c2', width: 2 },
          areaStyle: { color: 'rgba(19,194,194,0.1)' },
          symbol: 'none'
        },
        {
          name: '电池SOC',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: buoy.value.powerHistory.map(p => p.soc),
          lineStyle: { color: '#eb2f96', width: 2 },
          symbol: 'none'
        }
      ],
      tooltip: { trigger: 'axis' }
    });
  }
}

function resizeCharts() {
  waveChartInst?.resize();
  flowChartInst?.resize();
  tempChartInst?.resize();
  powerChartInst?.resize();
}

watch(
  () => store.selectedBuoyId,
  () => {
    setTimeout(() => {
      resizeCharts();
      updateCharts();
    }, 50);
  }
);

watch(
  () => buoy.value?.sensorHistory,
  () => updateCharts(),
  { deep: true }
);

onMounted(() => {
  initCharts();
  updateCharts();
  window.addEventListener('resize', resizeCharts);
});

onUnmounted(() => {
  waveChartInst?.dispose();
  flowChartInst?.dispose();
  tempChartInst?.dispose();
  powerChartInst?.dispose();
  window.removeEventListener('resize', resizeCharts);
});
</script>
