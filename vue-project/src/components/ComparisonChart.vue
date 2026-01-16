<script setup>
import { computed } from 'vue'
import LineChart from './LineChart.vue'
import { formatINR } from '../utils/date'

const props = defineProps({
  series: { type: Array, required: true },
})

const palette = [
  'rgba(17, 24, 39, 0.85)',
  'rgba(2, 132, 199, 0.85)',
  'rgba(124, 58, 237, 0.85)',
  'rgba(5, 150, 105, 0.85)',
  'rgba(220, 38, 38, 0.85)',
]

const labels = computed(() => {
  const all = new Set()
  for (const s of props.series) {
    for (const d of s.labels) all.add(d)
  }
  return Array.from(all).sort()
})

const datasets = computed(() => {
  const labelIndex = new Map(labels.value.map((d, i) => [d, i]))

  return props.series.map((s, idx) => {
    const points = new Array(labels.value.length).fill(null)
    for (let i = 0; i < s.labels.length; i += 1) {
      const d = s.labels[i]
      const pos = labelIndex.get(d)
      if (pos != null) points[pos] = s.values[i]
    }

    return {
      label: s.name,
      data: points,
      borderColor: palette[idx % palette.length],
      backgroundColor: 'transparent',
      pointRadius: 0,
      tension: 0.2,
      spanGaps: true,
    }
  })
})
</script>

<template>
  <div class="card">
    <div class="card__title">Comparison (portfolio value over time)</div>
    <div v-if="series.length < 2" class="hint">Select 2+ funds to compare.</div>
    <LineChart v-else :labels="labels" :datasets="datasets" :y-tick-formatter="formatINR" />
  </div>
</template>
