<script setup>
import { ref, watch, computed } from 'vue'
import { useNavData } from '../composables/useNavData'
import { useSipCalculator } from '../composables/useSipCalculator'
import { formatINR, formatNumber } from '../utils/date'

import SipConfigForm from './SipConfigForm.vue'
import SummaryCard from './SummaryCard.vue'
import FundTable from './FundTable.vue'
import LineChart from './LineChart.vue'

const props = defineProps({
  schemeCode: { type: String, required: true },
  sipConfig: { type: Object, required: true },
  selected: { type: Boolean, default: true },
})

const emit = defineEmits(['updateSipConfig', 'loadedMeta', 'update:comparisonSeries'])

const schemeCodeRef = ref(props.schemeCode)
watch(
  () => props.schemeCode,
  (v) => (schemeCodeRef.value = v),
)

const { meta, navRows, latest, earliest, isLoading, error, load, navOnOrBefore, navOnOrAfter, lastFetchedAt } =
  useNavData(schemeCodeRef)

watch(
  meta,
  (m) => {
    if (m?.scheme_name) emit('loadedMeta', { schemeCode: props.schemeCode, name: m.scheme_name })
  },
  { immediate: true },
)

watch(
  () => props.schemeCode,
  () => load(),
  { immediate: true },
)

const sipConfigRef = computed(() => props.sipConfig)
const { validationError, schedule, summary, chartSeries, cashflows } = useSipCalculator(
  { navOnOrBefore, navOnOrAfter, latest, earliest },
  sipConfigRef,
)

const displayName = computed(() => meta.value?.scheme_name || props.schemeCode)

watch(
  [displayName, chartSeries],
  () => {
    if (!chartSeries.value.labels.length) return
    emit('update:comparisonSeries', {
      schemeCode: props.schemeCode,
      name: displayName.value,
      labels: chartSeries.value.labels,
      values: chartSeries.value.values,
    })
  },
  { deep: true },
)

function refresh() {
  load({ forceRefresh: true })
}

const dataset = computed(() => [
  {
    label: 'Portfolio value',
    data: chartSeries.value.values,
    borderColor: 'rgba(17, 24, 39, 0.85)',
    backgroundColor: 'rgba(17, 24, 39, 0.05)',
    fill: true,
    pointRadius: 0,
    tension: 0.2,
  },
])
</script>

<template>
  <section class="panel" :class="{ 'panel--muted': !selected }">
    <div class="panel__head">
      <div>
        <div class="panel__title">{{ displayName }}</div>
        <div class="panel__sub">
          <span>Scheme: {{ schemeCode }}</span>
          <span v-if="latest">Latest NAV: ₹{{ formatNumber(latest.nav, 4) }} ({{ latest.dateISO }})</span>
        </div>
      </div>

      <div class="panel__actions">
        <button class="btn btn--ghost" type="button" @click="refresh" :disabled="isLoading">Refresh NAV</button>
      </div>
    </div>

    <div v-if="error" class="alert alert--danger">
      {{ error }}
    </div>

    <div v-else-if="isLoading" class="hint">Loading NAV history…</div>

    <template v-else>
      <SipConfigForm
        :scheme-code="schemeCode"
        :model-value="sipConfig"
        @update:model-value="(v) => emit('updateSipConfig', { schemeCode, patch: v })"
      />

      <div v-if="validationError" class="alert alert--warning" style="margin-top: 12px">
        {{ validationError }}
      </div>

      <div class="grid" style="margin-top: 12px">
        <SummaryCard
          :title="'Summary'"
          :invested="summary.totalInvested"
          :current="summary.currentValue"
          :profit="summary.profit"
          :xirr-pct="summary.xirrPct"
          :abs-return-pct="summary.absReturnPct"
          :units="summary.totalUnits"
          :cost-per-unit="summary.costPerUnit"
          :breakeven-date-iso="summary.breakevenDateISO"
        />

        <div class="card">
          <div class="card__title">Portfolio value over time</div>
          <LineChart :labels="chartSeries.labels" :datasets="dataset" :y-tick-formatter="formatINR" />
          <div class="hint" style="margin-top: 10px">
            Valuation uses NAV on (or previous to) each SIP execution date.
            <span v-if="lastFetchedAt">Cached at: {{ new Date(lastFetchedAt).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 12px">
        <FundTable :rows="schedule" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: 12px;
}
.panel--muted {
  opacity: 0.6;
}
.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.panel__title {
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.01em;
}
.panel__sub {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--muted);
  font-size: 12px;
  margin-top: 3px;
}
.panel__actions {
  display: flex;
  gap: 8px;
}
.grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 12px;
}
@media (max-width: 980px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
