<script setup>
import { formatINR, formatPct, formatNumber } from '../utils/date'

const props = defineProps({
  title: { type: String, required: true },
  invested: { type: Number, required: true },
  current: { type: Number, required: true },
  profit: { type: Number, required: true },
  xirrPct: { type: Number, default: null },
  absReturnPct: { type: Number, default: null },
  units: { type: Number, default: null },
  costPerUnit: { type: Number, default: null },
  breakevenDateISO: { type: String, default: null },
})

const profitClass = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu')
</script>

<template>
  <div class="card">
    <div class="card__title">{{ title }}</div>

    <div class="grid2">
      <div>
        <div class="metric__label">Total invested</div>
        <div class="metric__value">{{ formatINR(invested) }}</div>
      </div>
      <div>
        <div class="metric__label">Current value</div>
        <div class="metric__value">{{ formatINR(current) }}</div>
      </div>
      <div>
        <div class="metric__label">Profit / Loss</div>
        <div class="metric__value" :class="profitClass(profit)">
          {{ formatINR(profit) }}
        </div>
      </div>
      <div>
        <div class="metric__label">XIRR</div>
        <div class="metric__value">{{ xirrPct == null ? '—' : formatPct(xirrPct) }}</div>
      </div>
    </div>

    <div v-if="absReturnPct != null || units != null || costPerUnit != null || breakevenDateISO" class="submetrics">
      <div v-if="absReturnPct != null">
        <span class="metric__label">Absolute return:</span>
        <span class="metric__inline">{{ formatPct(absReturnPct) }}</span>
      </div>
      <div v-if="units != null">
        <span class="metric__label">Units:</span>
        <span class="metric__inline">{{ formatNumber(units, 4) }}</span>
      </div>
      <div v-if="costPerUnit != null">
        <span class="metric__label">Avg cost / unit:</span>
        <span class="metric__inline">₹{{ formatNumber(costPerUnit, 4) }}</span>
      </div>
      <div v-if="breakevenDateISO">
        <span class="metric__label">Breakeven date:</span>
        <span class="metric__inline">{{ breakevenDateISO }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.metric__label {
  font-size: 12px;
  color: var(--muted);
}
.metric__value {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.metric__inline {
  font-weight: 600;
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
.submetrics {
  margin-top: 10px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
</style>
