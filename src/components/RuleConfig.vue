<template>
  <div>
    <div class="section-header">
      <span class="section-title">告警规则配置</span>
    </div>

    <div v-for="rule in store.rules" :key="rule.id" class="rule-item">
      <div class="rule-header">
        <span class="rule-name">{{ rule.name }}</span>
        <el-switch v-model="enabledMap[rule.id]" @change="onEnabledChange(rule)" />
      </div>
      <div class="rule-config">
        <span>阈值:</span>
        <el-input-number
          v-model="thresholdMap[rule.id]"
          :min="0"
          :step="rule.type === 'no_heartbeat' ? 1 : 0.5"
          :precision="rule.type === 'no_heartbeat' ? 0 : 1"
          size="small"
          style="width: 120px;"
          @change="onThresholdChange(rule)"
        />
        <span>{{ rule.unit }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useBuoyStore } from '@/stores/buoy';
import type { AlertRule } from '@/types';

const store = useBuoyStore();

const enabledMap = reactive<Record<string, boolean>>({});
const thresholdMap = reactive<Record<string, number>>({});

onMounted(() => {
  for (const rule of store.rules) {
    enabledMap[rule.id] = rule.enabled;
    thresholdMap[rule.id] = rule.threshold;
  }
});

function onEnabledChange(rule: AlertRule) {
  store.updateRule(rule.id, { enabled: enabledMap[rule.id] });
}

function onThresholdChange(rule: AlertRule) {
  store.updateRule(rule.id, { threshold: thresholdMap[rule.id] });
}
</script>
