<script setup>
import { computed, ref } from 'vue'
import { usePortfolioState } from '../composables/usePortfolioState'
import { useAggregatePortfolio } from '../composables/useAggregatePortfolio'

import FundAddForm from '../components/FundAddForm.vue'
import FundList from '../components/FundList.vue'
import FundConfigCard from '../components/FundConfigCard.vue'
import PortfolioSummary from '../components/PortfolioSummary.vue'

const { fundSchemeCodes, sipConfigsByScheme, addFund, removeFund, updateSipConfig, setPortfolioState } =
  usePortfolioState()

const selectedSchemeCodes = ref([])

// Default selection: all funds
if (!selectedSchemeCodes.value.length && fundSchemeCodes.value.length) {
  selectedSchemeCodes.value = [...fundSchemeCodes.value]
}

function encodeSharePayload(payload) {
  try {
    const json = JSON.stringify(payload)
    const b64 = btoa(unescape(encodeURIComponent(json)))
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  } catch {
    return ''
  }
}

function decodeShareParam(param) {
  try {
    const normalized = param.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '==='.slice((normalized.length + 3) % 4)
    const json = decodeURIComponent(escape(atob(padded)))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function applySharedState() {
  const params = new URLSearchParams(window.location.search)
  const shared = params.get('share')
  if (!shared) return
  const payload = decodeShareParam(shared)
  if (!payload) return
  setPortfolioState(payload)
  selectedSchemeCodes.value = Array.isArray(payload.fundSchemeCodes)
    ? payload.fundSchemeCodes.map((v) => String(v)).filter(Boolean)
    : []

  params.delete('share')
  const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${
    window.location.hash || ''
  }`
  window.history.replaceState({}, '', next)
}

applySharedState()

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

const shareUrl = computed(() => {
  const payload = {
    fundSchemeCodes: fundSchemeCodes.value,
    sipConfigsByScheme: sipConfigsByScheme.value,
  }
  const encoded = encodeSharePayload(payload)
  if (!encoded) return ''
  const url = new URL(window.location.href)
  url.searchParams.set('share', encoded)
  return url.toString()
})

const shareStatus = ref('')
async function copyShareLink() {
  shareStatus.value = ''
  const url = shareUrl.value
  if (!url) {
    shareStatus.value = 'Nothing to share yet.'
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    shareStatus.value = 'Share link copied.'
  } catch {
    shareStatus.value = 'Copy failed. Select and copy the link below.'
  }
}
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
        <div class="card">
          <div class="card__title">Share portfolio</div>
          <div class="hint">Creates a link with your funds and SIP settings encoded.</div>
          <div class="share">
            <button class="btn" type="button" @click="copyShareLink">Copy share link</button>
            <div v-if="shareStatus" class="hint" style="margin-top: 6px">{{ shareStatus }}</div>
            <input v-if="shareUrl" class="input" :value="shareUrl" readonly />
          </div>
        </div>
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
.share {
  display: grid;
  gap: 8px;
  margin-top: 8px;
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
