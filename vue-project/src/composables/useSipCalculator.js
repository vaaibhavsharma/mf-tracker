import { computed } from 'vue'
import { isoToDate, dateToISO, addMonthsKeepingDay, todayISO } from '../utils/date'
import { xirr } from '../utils/xirr'

/**
 * SIP calculator composable.
 *
 * Execution rules:
 * - "previous": If NAV not available on SIP date, use previous available NAV.
 * - "next": If NAV not available on SIP date, use next available NAV (real-world processing).
 */
export function useSipCalculator({ navOnOrBefore, navOnOrAfter, latest, earliest }, sipConfigRef) {
  const validationError = computed(() => {
    const cfg = sipConfigRef.value
    if (!cfg) return 'Missing SIP configuration'
    const amount = Number(cfg.amount)
    if (!Number.isFinite(amount) || amount <= 0) return 'Enter a valid SIP amount'
    if (!cfg.startDateISO) return 'Select a SIP start date'

    const start = isoToDate(cfg.startDateISO)
    if (!start) return 'Invalid start date'

    const today = isoToDate(todayISO())
    if (start.getTime() > today.getTime()) return 'Start date cannot be in the future'

    if (cfg.endDateISO) {
      const end = isoToDate(cfg.endDateISO)
      if (!end) return 'Invalid end date'
      if (end.getTime() > today.getTime()) return 'End date cannot be in the future'
      if (end.getTime() < start.getTime()) return 'End date cannot be before start date'
    }

    if (!earliest.value) return null
    const fundLaunchDate = isoToDate(earliest.value.dateISO)
    if (start.getTime() < fundLaunchDate.getTime()) {
      return `SIP start date is before fund launch (${earliest.value.dateISO})`
    }

    return null
  })

  const schedule = computed(() => {
    const cfg = sipConfigRef.value
    if (!cfg || validationError.value) return []

    const baseAmount = Number(cfg.amount)
    const start = isoToDate(cfg.startDateISO)
    const day = start.getDate()
    const executionRule = cfg.executionRule === 'previous' ? 'previous' : 'next'
    const stepUpPctAnnual = Number(cfg.stepUpPctAnnual || 0)

    const today = isoToDate(todayISO())
    const endDate = cfg.endDateISO ? isoToDate(cfg.endDateISO) : today
    const lastDate = endDate && endDate.getTime() < today.getTime() ? endDate : today

    const rows = []
    let cumulativeUnits = 0
    let totalInvested = 0

    function amountForInstallment(monthIndex) {
      if (!Number.isFinite(stepUpPctAnnual) || stepUpPctAnnual <= 0) return baseAmount
      const yearsElapsed = Math.floor(monthIndex / 12)
      return baseAmount * Math.pow(1 + stepUpPctAnnual / 100, yearsElapsed)
    }

    // Iterate month-by-month from start until today.
    // We clamp day-of-month (e.g. 31st -> 30th/28th when needed).
    for (let i = 0; i < 2000; i += 1) {
      const scheduledDate = addMonthsKeepingDay(start, i, day)
      if (scheduledDate.getTime() > lastDate.getTime()) break

      const targetISO = dateToISO(scheduledDate)
      const navPoint =
        executionRule === 'previous'
          ? navOnOrBefore(targetISO)
          : navOnOrAfter
            ? navOnOrAfter(targetISO)
            : null

      if (!navPoint) {
        // For "next" rule, if we don't have a future NAV yet, SIP hasn't executed.
        // Stop the schedule at the last executable installment.
        if (executionRule === 'next') break
        // For "previous" rule, missing NAV is only possible before fund launch.
        return []
      }

      const sipAmount = amountForInstallment(i)

      const units = sipAmount / navPoint.nav
      cumulativeUnits += units
      totalInvested += sipAmount

      // Value at that point in time uses the same NAV date (on or before schedule).
      const value = cumulativeUnits * navPoint.nav

      rows.push({
        monthIndex: i,
        scheduledISO: targetISO,
        navDateISO: navPoint.dateISO,
        nav: navPoint.nav,
        sipAmount,
        unitsBought: units,
        cumulativeUnits,
        value,
        investedToDate: totalInvested,
      })
    }

    return rows
  })

  const summary = computed(() => {
    const rows = schedule.value
    const cfg = sipConfigRef.value
    if (!cfg || validationError.value) {
      return {
        totalInvested: 0,
        totalUnits: 0,
        currentValue: 0,
        profit: 0,
        absReturnPct: null,
        xirrPct: null,
        costPerUnit: null,
        breakevenDateISO: null,
      }
    }

    const latestPoint = latest.value
    if (!latestPoint || !rows.length) {
      return {
        totalInvested: 0,
        totalUnits: 0,
        currentValue: 0,
        profit: 0,
        absReturnPct: null,
        xirrPct: null,
        costPerUnit: null,
        breakevenDateISO: null,
      }
    }

    const totalInvested = rows[rows.length - 1].investedToDate
    const totalUnits = rows[rows.length - 1].cumulativeUnits
    const currentValue = totalUnits * latestPoint.nav
    const profit = currentValue - totalInvested
    const absReturnPct = totalInvested > 0 ? (profit / totalInvested) * 100 : null

    const costPerUnit = totalUnits > 0 ? totalInvested / totalUnits : null
    const breakeven = rows.find((r) => r.value >= r.investedToDate)
    const breakevenDateISO = breakeven ? breakeven.navDateISO : null

    // Build cashflows for XIRR:
    // - Each SIP installment is a negative cashflow on the actual NAV date used.
    // - Final positive cashflow equals current value at the latest NAV date.
    const flows = rows.map((r) => ({
      amount: -r.sipAmount,
      date: isoToDate(r.navDateISO),
    }))
    flows.push({
      amount: currentValue,
      date: isoToDate(latestPoint.dateISO),
    })

    const rate = xirr(flows)

    return {
      totalInvested,
      totalUnits,
      currentValue,
      profit,
      absReturnPct,
      xirrPct: rate == null ? null : rate * 100,
      latestNav: latestPoint.nav,
      latestNavDateISO: latestPoint.dateISO,
      costPerUnit,
      breakevenDateISO,
    }
  })

  const cashflows = computed(() => {
    const rows = schedule.value
    const latestPoint = latest.value
    if (!rows.length || !latestPoint) return []
    const totalUnits = rows[rows.length - 1].cumulativeUnits
    const currentValue = totalUnits * latestPoint.nav
    return [
      ...rows.map((r) => ({ amount: -r.sipAmount, date: isoToDate(r.navDateISO) })),
      { amount: currentValue, date: isoToDate(latestPoint.dateISO) },
    ]
  })

  const chartSeries = computed(() => {
    const rows = schedule.value
    if (!rows.length) return { labels: [], values: [] }
    return {
      labels: rows.map((r) => r.navDateISO),
      values: rows.map((r) => r.value),
    }
  })

  return {
    validationError,
    schedule,
    summary,
    chartSeries,
    cashflows,
  }
}
