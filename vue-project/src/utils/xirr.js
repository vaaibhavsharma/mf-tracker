// XIRR implementation (browser-side) for irregular cashflows.
// Uses Newton-Raphson with a bisection fallback.

function daysBetween(a, b) {
  const ms = b.getTime() - a.getTime()
  return ms / (1000 * 60 * 60 * 24)
}

/**
 * @typedef {{ amount: number, date: Date }} Cashflow
 */

function npv(rate, cashflows) {
  const r = 1 + rate
  const t0 = cashflows[0].date
  let sum = 0
  for (const cf of cashflows) {
    const t = daysBetween(t0, cf.date) / 365
    sum += cf.amount / Math.pow(r, t)
  }
  return sum
}

function dnpv(rate, cashflows) {
  const r = 1 + rate
  const t0 = cashflows[0].date
  let sum = 0
  for (const cf of cashflows) {
    const t = daysBetween(t0, cf.date) / 365
    // derivative of amount / (1+rate)^t is: -t*amount/(1+rate)^(t+1)
    sum += (-t * cf.amount) / Math.pow(r, t + 1)
  }
  return sum
}

function sortCashflows(cashflows) {
  return [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Compute XIRR for a set of cashflows.
 * Returns a decimal rate (e.g. 0.12 for 12%), or null if it can't converge.
 *
 * Notes:
 * - Requires at least one negative and one positive cashflow.
 * - Dates should be JS Date objects.
 */
export function xirr(cashflows, { guess = 0.12 } = {}) {
  if (!Array.isArray(cashflows) || cashflows.length < 2) return null
  const flows = sortCashflows(cashflows)

  const hasNeg = flows.some((c) => c.amount < 0)
  const hasPos = flows.some((c) => c.amount > 0)
  if (!hasNeg || !hasPos) return null

  // Newton-Raphson
  let rate = guess
  for (let i = 0; i < 60; i += 1) {
    if (rate <= -0.999999) rate = -0.999999
    const f = npv(rate, flows)
    const df = dnpv(rate, flows)
    if (!Number.isFinite(f) || !Number.isFinite(df) || Math.abs(df) < 1e-12) break
    const next = rate - f / df
    if (!Number.isFinite(next)) break
    if (Math.abs(next - rate) < 1e-10) return next
    rate = next
  }

  // Bisection fallback: find bracket where npv changes sign.
  // Search rate in [-0.9999, 10] (i.e. up to 1000% annualized).
  const min = -0.9999
  const max = 10
  let lo = min
  let hi = max
  let flo = npv(lo, flows)
  let fhi = npv(hi, flows)

  if (!Number.isFinite(flo) || !Number.isFinite(fhi)) return null

  if (flo === 0) return lo
  if (fhi === 0) return hi

  // If no sign change, try to scan to find a bracket.
  if (flo * fhi > 0) {
    const scan = [-0.9, -0.5, -0.2, 0, 0.1, 0.2, 0.5, 1, 2, 5, 10]
    let found = false
    for (let i = 0; i < scan.length - 1; i += 1) {
      const a = scan[i]
      const b = scan[i + 1]
      const fa = npv(a, flows)
      const fb = npv(b, flows)
      if (Number.isFinite(fa) && Number.isFinite(fb) && fa * fb <= 0) {
        lo = a
        hi = b
        flo = fa
        fhi = fb
        found = true
        break
      }
    }
    if (!found) return null
  }

  for (let i = 0; i < 120; i += 1) {
    const mid = (lo + hi) / 2
    const fmid = npv(mid, flows)
    if (!Number.isFinite(fmid)) return null
    if (Math.abs(fmid) < 1e-8) return mid
    if (flo * fmid <= 0) {
      hi = mid
      fhi = fmid
    } else {
      lo = mid
      flo = fmid
    }
    if (Math.abs(hi - lo) < 1e-10) return (hi + lo) / 2
  }

  return null
}
