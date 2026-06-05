<template>
  <div class="map-panel">
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import L from 'leaflet';
import type { Buoy } from '@/types';
import { useBuoyStore } from '@/stores/buoy';

const store = useBuoyStore();
const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
const markers = new Map<string, L.CircleMarker>();

function getStatusColor(status: Buoy['status']): string {
  switch (status) {
    case 'online':
      return '#52c41a';
    case 'warning':
      return '#faad14';
    case 'offline':
      return '#ff4d4f';
  }
}

function createMarker(buoy: Buoy): L.CircleMarker {
  const marker = L.circleMarker([buoy.lat, buoy.lng], {
    radius: 10,
    fillColor: getStatusColor(buoy.status),
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.9,
  });
  marker.bindPopup(`
    <div class="buoy-popup-marker" data-buoy-id="${buoy.id}">
      <strong>${buoy.name}</strong><br/>
      状态: <span class="status-badge ${buoy.status}">${
        buoy.status === 'online' ? '在线' : buoy.status === 'warning' ? '告警' : '失联'
      }</span><br/>
      点击查看详情
    </div>
  `);
  marker.on('click', () => {
    store.selectedBuoyId = buoy.id;
  });
  return marker;
}

function initMap() {
  if (!mapContainer.value) return;
  map = L.map(mapContainer.value).setView([31.23, 121.47], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);
}

function updateMarkers() {
  if (!map) return;
  const currentIds = new Set(store.buoys.map(b => b.id));
  for (const [id, marker] of markers.entries()) {
    if (!currentIds.has(id)) {
      map.removeLayer(marker);
      markers.delete(id);
    }
  }
  for (const buoy of store.buoys) {
    const existing = markers.get(buoy.id);
    if (existing) {
      existing.setStyle({ fillColor: getStatusColor(buoy.status) });
    } else {
      const marker = createMarker(buoy);
      marker.addTo(map);
      markers.set(buoy.id, marker);
    }
  }
}

onMounted(() => {
  initMap();
  updateMarkers();
});

watch(
  () => store.buoys,
  () => updateMarkers(),
  { deep: true }
);

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
