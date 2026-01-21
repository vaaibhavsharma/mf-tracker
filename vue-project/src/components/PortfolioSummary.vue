<script setup>
import { computed } from 'vue'
import { formatDurationMonths, formatINR, formatPct } from '../utils/date'
import LineChart from './LineChart.vue'

const props = defineProps({
  title: { type: String, default: 'Total portfolio (selected funds)' },
  summary: { type: Object, required: true },
  series: { type: Object, required: true },
})

const dataset = computed(() => [
  {
    label: 'Total portfolio value',
    data: props.series.values,
    borderColor: 'rgba(17, 24, 39, 0.85)',
    backgroundColor: 'rgba(17, 24, 39, 0.06)',
    fill: true,
    pointRadius: 0,
    tension: 0.2,
  },
])
</script>

<template>
  <div class="card">
    <div class="card__title">{{ title }}</div>

    <div class="grid">
      <div class="kpis">
        <div>
          <div class="metric__label">Funds selected</div>
          <div class="metric__value">{{ summary.fundsCount || 0 }}</div>
        </div>
        <div>
          <div class="metric__label">Total invested</div>
          <div class="metric__value">{{ formatINR(summary.totalInvested) }}</div>
        </div>
        <div>
          <div class="metric__label">Time invested</div>
          <div class="metric__value">
            {{ summary.investedMonths == null ? '—' : formatDurationMonths(summary.investedMonths) }}
          </div>
        </div>
        <div>
          <div class="metric__label">Current value</div>
          <div class="metric__value">{{ formatINR(summary.currentValue) }}</div>
        </div>
        <div>
          <div class="metric__label">Profit / Loss</div>
          <div class="metric__value" :class="summary.profit > 0 ? 'pos' : summary.profit < 0 ? 'neg' : 'neu'">
            {{ formatINR(summary.profit) }}
          </div>
        </div>
        <div>
          <div class="metric__label">XIRR</div>
          <div class="metric__value">{{ summary.xirrPct == null ? '—' : formatPct(summary.xirrPct) }}</div>
        </div>
      </div>

      <div>
        <LineChart :labels="series.labels" :datasets="dataset" :y-tick-formatter="formatINR" />
      </div>
    </div>

    <div class="hint" style="margin-top: 10px">
      XIRR is computed from combined cashflows of the selected funds.
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 12px;
  align-items: start;
}
.kpis {
  display: grid;
  gap: 12px;
}
.metric__label {
  font-size: 12px;
  color: var(--muted);
}
.metric__value {
  font-size: 18px;
  font-weight: 650;
}
.pos {
  color: var(--green);
}
.neg {
  color: var(--red);
}
.neu {
  color: var(--text);
}
@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
