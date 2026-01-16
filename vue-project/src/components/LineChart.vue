<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, TimeScale)

const props = defineProps({
  labels: { type: Array, required: true },
  datasets: { type: Array, required: true },
  yTickFormatter: { type: Function, default: null },
})

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: true, position: 'bottom', labels: { boxWidth: 10, boxHeight: 10 } },
    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}` } },
  },
  scales: {
    x: { ticks: { maxRotation: 0, autoSkip: true }, grid: { display: false } },
    y: {
      grid: { color: 'rgba(0,0,0,0.06)' },
      ticks: props.yTickFormatter
        ? {
            callback: (v) => props.yTickFormatter(v),
          }
        : undefined,
    },
  },
}))

const data = computed(() => ({
  labels: props.labels,
  datasets: props.datasets,
}))
</script>

<template>
  <div class="chart">
    <Line :data="data" :options="options" />
  </div>
</template>

<style scoped>
.chart {
  height: 280px;
}
</style>
