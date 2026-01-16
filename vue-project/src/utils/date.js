// Date + formatting helpers for MFAPI SIP tracker.
// MFAPI provides dates in DD-MM-YYYY; internally we use ISO YYYY-MM-DD.

/**
 * Convert MFAPI date string (DD-MM-YYYY) to ISO date (YYYY-MM-DD).
 */
export function mfapiDateToISO(mfapiDate) {
  if (typeof mfapiDate !== 'string') return null
  const parts = mfapiDate.trim().split('-')
  if (parts.length !== 3) return null
  const [dd, mm, yyyy] = parts
  if (!dd || !mm || !yyyy) return null
  return `${yyyy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

/**
 * ISO date (YYYY-MM-DD) -> Date object at local midnight.
 */
export function isoToDate(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map((v) => Number(v))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

/**
 * Date -> ISO YYYY-MM-DD (local date).
 */
export function dateToISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return dateToISO(new Date())
}

export function clampDayOfMonth(year, monthIndex0, desiredDay) {
  // monthIndex0: 0..11
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate()
  return Math.min(Math.max(1, desiredDay), lastDay)
}

export function addMonthsKeepingDay(startDate, monthOffset, desiredDay) {
  // Produces a date in local time.
  const y = startDate.getFullYear()
  const m = startDate.getMonth()
  const targetMonth = m + monthOffset
  const d = clampDayOfMonth(y, targetMonth, desiredDay)
  return new Date(y, targetMonth, d)
}

export function formatINR(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatNumber(value, digits = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}

export function formatPct(value, digits = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${formatNumber(n, digits)}%`
}
