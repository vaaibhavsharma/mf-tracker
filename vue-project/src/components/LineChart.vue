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
import { formatMonthYear, formatDateLong } from '../utils/date'

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
    tooltip: {
      callbacks: {
        title: (items) => {
          const first = items?.[0]
          const label = first?.label
          return formatDateLong(label)
        },
        label: (ctx) => {
          const value = props.yTickFormatter ? props.yTickFormatter(ctx.parsed.y) : ctx.formattedValue
          return `${ctx.dataset.label}: ${value}`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
        callback: (value, index) => formatMonthYear(props.labels[index]),
      },
      grid: { display: false },
    },
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
@media (max-width: 680px) {
  .chart {
    height: 220px;
  }
}
</style>
