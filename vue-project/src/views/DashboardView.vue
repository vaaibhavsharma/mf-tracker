<script setup>
import { computed, ref } from 'vue'
import { usePortfolioState } from '../composables/usePortfolioState'
import { useAggregatePortfolio } from '../composables/useAggregatePortfolio'

import FundAddForm from '../components/FundAddForm.vue'
import FundList from '../components/FundList.vue'
import FundConfigCard from '../components/FundConfigCard.vue'
import PortfolioSummary from '../components/PortfolioSummary.vue'

const { fundSchemeCodes, sipConfigsByScheme, addFund, removeFund, updateSipConfig } =
  usePortfolioState()

const selectedSchemeCodes = ref([])

// Default selection: all funds
if (!selectedSchemeCodes.value.length && fundSchemeCodes.value.length) {
  selectedSchemeCodes.value = [...fundSchemeCodes.value]
}

function toggleSelected(schemeCode) {
  const code = String(schemeCode)
  if (selectedSchemeCodes.value.includes(code)) {
    selectedSchemeCodes.value = selectedSchemeCodes.value.filter((c) => c !== code)
  } else {
    selectedSchemeCodes.value = [...selectedSchemeCodes.value, code]
  }
}

function handleAddFund(schemeCode) {
  addFund(schemeCode)
  const code = String(schemeCode).trim()
  if (code && !selectedSchemeCodes.value.includes(code)) {
    selectedSchemeCodes.value = [...selectedSchemeCodes.value, code]
  }
}

function handleRemoveFund(schemeCode) {
  removeFund(schemeCode)
  selectedSchemeCodes.value = selectedSchemeCodes.value.filter((c) => c !== schemeCode)
  delete fundMetricsStore.value[schemeCode]
}

const namesByScheme = ref({})
function onLoadedMeta({ schemeCode, name }) {
  namesByScheme.value = { ...namesByScheme.value, [schemeCode]: name }
}

const fundListItems = computed(() =>
  fundSchemeCodes.value.map((schemeCode) => ({
    schemeCode,
    name: namesByScheme.value[schemeCode] || null,
  })),
)

// Per-fund computed outputs (summary, cashflows, series) emitted by FundConfigCard.
const fundMetricsStore = ref({})
function upsertFundMetrics(payload) {
  // payload: { schemeCode, name, summary, cashflows, series }
  fundMetricsStore.value = { ...fundMetricsStore.value, [payload.schemeCode]: payload }
}

const { summary: totalSummary } = useAggregatePortfolio(fundMetricsStore, selectedSchemeCodes)

function buildTotalSeries(selectedCodes, metricsByScheme) {
  // Produce a date-aligned time series of total portfolio value.
  // We union all label dates and carry-forward last known value per fund.
  const allDates = new Set()
  for (const code of selectedCodes) {
    const s = metricsByScheme[code]?.series
    if (!s?.labels?.length) continue
    for (const d of s.labels) allDates.add(d)
  }
  const labels = Array.from(allDates).sort()
  if (!labels.length) return { labels: [], values: [] }

  // Build per-fund pointer for carry forward.
  const perFund = selectedCodes
    .map((code) => {
      const s = metricsByScheme[code]?.series
      if (!s?.labels?.length) return null
      return { code, labels: s.labels, values: s.values, i: 0, last: 0 }
    })
    .filter(Boolean)

  const values = labels.map((d) => {
    let total = 0
    for (const f of perFund) {
      while (f.i < f.labels.length && f.labels[f.i] <= d) {
        const v = Number(f.values[f.i])
        if (Number.isFinite(v)) f.last = v
        f.i += 1
      }
      total += f.last
    }
    return total
  })

  return { labels, values }
}

const totalSeries = computed(() => buildTotalSeries(selectedSchemeCodes.value, fundMetricsStore.value))
</script>

<template>
  <div class="dashboard">
    <div class="layout">
      <aside class="sidebar">
        <FundAddForm @add="handleAddFund" />
        <FundList
          :funds="fundListItems"
          :selected="selectedSchemeCodes"
          @toggle="toggleSelected"
          @remove="handleRemoveFund"
        />
      </aside>

      <main class="content">
        <PortfolioSummary :summary="totalSummary" :series="totalSeries" />

        <div v-if="!fundSchemeCodes.length" class="card empty">
          Add a fund (search by name or scheme code) to begin.
        </div>

        <div v-else class="configs">
          <FundConfigCard
            v-for="schemeCode in fundSchemeCodes"
            :key="schemeCode"
            :scheme-code="schemeCode"
            :sip-config="sipConfigsByScheme[schemeCode]"
            :selected="selectedSchemeCodes.includes(schemeCode)"
            @loaded-meta="onLoadedMeta"
            @updateSipConfig="({ schemeCode: sc, patch }) => updateSipConfig(sc, patch)"
            @metrics="upsertFundMetrics"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 12px;
  align-items: start;
}
.sidebar {
  display: grid;
  gap: 12px;
  position: sticky;
  top: 12px;
}
.content {
  display: grid;
  gap: 12px;
}
.configs {
  display: grid;
  gap: 12px;
}
@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .sidebar {
    position: static;
  }
}
</style>
