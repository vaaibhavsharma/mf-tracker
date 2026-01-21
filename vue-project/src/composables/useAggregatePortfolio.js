import { computed } from 'vue'
import { dateToISO, diffMonthsISO } from '../utils/date'
import { xirr } from '../utils/xirr'

/**
 * Combine multiple funds into a single "portfolio" view.
 *
 * Inputs per fund:
 * - summary: { totalInvested, currentValue, profit, xirrPct, ... }
 * - cashflows: [{ amount, date }, ...] including final positive inflow
 */
export function useAggregatePortfolio(fundMetricsRef, selectedSchemeCodesRef) {
  const selectedMetrics = computed(() => {
    const all = fundMetricsRef.value || {}
    const selected = new Set(selectedSchemeCodesRef.value || [])
    const out = []
    for (const [schemeCode, m] of Object.entries(all)) {
      if (!selected.has(schemeCode)) continue
      if (!m?.summary) continue
      out.push({ schemeCode, ...m })
    }
    return out
  })

  const summary = computed(() => {
    const funds = selectedMetrics.value
    const totalInvested = funds.reduce((s, f) => s + (Number(f.summary.totalInvested) || 0), 0)
    const currentValue = funds.reduce((s, f) => s + (Number(f.summary.currentValue) || 0), 0)
    const profit = currentValue - totalInvested
    const absReturnPct = totalInvested > 0 ? (profit / totalInvested) * 100 : null

    const flows = funds.flatMap((f) => (Array.isArray(f.cashflows) ? f.cashflows : []))
    const flowDates = flows.map((f) => f?.date).filter((d) => d instanceof Date)
    const fromISO = flowDates.length
      ? dateToISO(new Date(Math.min(...flowDates.map((d) => d.getTime()))))
      : null
    const toISO = flowDates.length
      ? dateToISO(new Date(Math.max(...flowDates.map((d) => d.getTime()))))
      : null
    const investedMonths = fromISO && toISO ? diffMonthsISO(fromISO, toISO) : null
    // XIRR needs both positive and negative flows.
    const rate = flows.length >= 2 ? xirr(flows) : null

    return {
      totalInvested,
      currentValue,
      profit,
      absReturnPct,
      xirrPct: rate == null ? null : rate * 100,
      fundsCount: funds.length,
      investedFromISO: fromISO,
      investedToISO: toISO,
      investedMonths,
    }
  })

  return { selectedMetrics, summary }
}
