import { ref, watch } from 'vue'
import { todayISO } from '../utils/date'

const LS_FUNDS = 'mfTracker.funds.v1'
const LS_CONFIGS = 'mfTracker.configs.v1'

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function usePortfolioState() {
  const fundSchemeCodes = ref([])
  const sipConfigsByScheme = ref({})

  // Load
  const storedFunds = safeJsonParse(localStorage.getItem(LS_FUNDS), [])
  if (Array.isArray(storedFunds)) {
    fundSchemeCodes.value = storedFunds.map((v) => String(v)).filter(Boolean)
  }

  const storedConfigs = safeJsonParse(localStorage.getItem(LS_CONFIGS), {})
  if (storedConfigs && typeof storedConfigs === 'object') {
    const normalized = {}
    for (const [code, cfg] of Object.entries(storedConfigs)) {
      normalized[code] = {
        endDateISO: todayISO(),
        ...cfg,
      }
    }
    sipConfigsByScheme.value = normalized
  }

  // Persist
  watch(
    fundSchemeCodes,
    (v) => localStorage.setItem(LS_FUNDS, JSON.stringify(v)),
    { deep: true },
  )

  watch(
    sipConfigsByScheme,
    (v) => localStorage.setItem(LS_CONFIGS, JSON.stringify(v)),
    { deep: true },
  )

  function addFund(schemeCode) {
    const code = String(schemeCode || '').trim()
    if (!code) return
    if (!fundSchemeCodes.value.includes(code)) {
      fundSchemeCodes.value = [...fundSchemeCodes.value, code]
    }
    if (!sipConfigsByScheme.value[code]) {
      // Defaults: monthly SIP, amount empty until set.
      sipConfigsByScheme.value = {
        ...sipConfigsByScheme.value,
        [code]: {
          amount: 1000,
          startDateISO: '',
          endDateISO: todayISO(),
          frequency: 'monthly',
          stepUpPctAnnual: 0,
          executionRule: 'next',
        },
      }
    }
  }

  function removeFund(schemeCode) {
    const code = String(schemeCode || '').trim()
    fundSchemeCodes.value = fundSchemeCodes.value.filter((c) => c !== code)
    const { [code]: _removed, ...rest } = sipConfigsByScheme.value
    sipConfigsByScheme.value = rest
  }

  function updateSipConfig(schemeCode, patch) {
    const code = String(schemeCode || '').trim()
    const prev = sipConfigsByScheme.value[code] || {}
    sipConfigsByScheme.value = {
      ...sipConfigsByScheme.value,
      [code]: { ...prev, ...patch },
    }
  }

  function setPortfolioState(payload) {
    if (!payload || typeof payload !== 'object') return
    const funds = Array.isArray(payload.fundSchemeCodes)
      ? payload.fundSchemeCodes.map((v) => String(v)).filter(Boolean)
      : []
    const configs =
      payload.sipConfigsByScheme && typeof payload.sipConfigsByScheme === 'object'
        ? payload.sipConfigsByScheme
        : {}

    fundSchemeCodes.value = funds
    sipConfigsByScheme.value = configs
  }

  return {
    fundSchemeCodes,
    sipConfigsByScheme,
    addFund,
    removeFund,
    updateSipConfig,
    setPortfolioState,
  }
}
