import { ref, computed } from 'vue'
import { getCachedFund, setCachedFund } from '../utils/db'
import { mfapiDateToISO } from '../utils/date'

function normalizeNavRows(rows) {
  // MFAPI returns newest-first. We normalize to ascending by date.
  const normalized = []
  for (const r of rows || []) {
    const iso = mfapiDateToISO(r.date)
    const nav = Number(r.nav)
    if (!iso || !Number.isFinite(nav)) continue
    normalized.push({ dateISO: iso, nav })
  }
  normalized.sort((a, b) => (a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0))
  return normalized
}

function buildIndex(navRowsAsc) {
  const dates = navRowsAsc.map((r) => r.dateISO)
  const navs = navRowsAsc.map((r) => r.nav)
  return { dates, navs }
}

function binarySearchLastLE(datesAsc, targetISO) {
  // right-most index where datesAsc[i] <= targetISO (ISO strings sort lexicographically)
  let lo = 0
  let hi = datesAsc.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (datesAsc[mid] <= targetISO) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

function binarySearchFirstGE(datesAsc, targetISO) {
  // left-most index where datesAsc[i] >= targetISO
  let lo = 0
  let hi = datesAsc.length - 1
  let ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (datesAsc[mid] >= targetISO) {
      ans = mid
      hi = mid - 1
    } else {
      lo = mid + 1
    }
  }
  return ans
}

export function useNavData(schemeCodeRef) {
  const meta = ref(null)
  const navRows = ref([]) // ascending
  const isLoading = ref(false)
  const error = ref(null)
  const lastFetchedAt = ref(null)

  const index = computed(() => buildIndex(navRows.value))
  const latest = computed(() => {
    const rows = navRows.value
    if (!rows.length) return null
    return rows[rows.length - 1]
  })
  const earliest = computed(() => {
    const rows = navRows.value
    if (!rows.length) return null
    return rows[0]
  })

  function navOnOrBefore(targetISO) {
    const { dates, navs } = index.value
    if (!dates.length) return null
    const i = binarySearchLastLE(dates, targetISO)
    if (i < 0) return null
    return { dateISO: dates[i], nav: navs[i] }
  }

  function navOnOrAfter(targetISO) {
    const { dates, navs } = index.value
    if (!dates.length) return null
    const i = binarySearchFirstGE(dates, targetISO)
    if (i < 0) return null
    return { dateISO: dates[i], nav: navs[i] }
  }

  async function load({ forceRefresh = false } = {}) {
    const schemeCode = String(schemeCodeRef.value || '').trim()
    if (!schemeCode) return

    isLoading.value = true
    error.value = null

    try {
      if (!forceRefresh) {
        const cached = await getCachedFund(schemeCode)
        if (cached?.navRows?.length) {
          meta.value = cached.meta
          navRows.value = cached.navRows
          lastFetchedAt.value = cached.fetchedAt
          isLoading.value = false
          return
        }
      }

      const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}`)
      if (!res.ok) throw new Error(`API error (${res.status})`)
      const json = await res.json()

      // MFAPI uses "status": "SUCCESS" / "FAIL" on some responses.
      if (json?.status && String(json.status).toUpperCase() !== 'SUCCESS') {
        throw new Error(json?.message || 'Invalid scheme code')
      }
      if (!json?.meta?.scheme_name || !Array.isArray(json?.data)) {
        throw new Error('Unexpected API response')
      }

      const normalized = normalizeNavRows(json.data)
      if (!normalized.length) throw new Error('No NAV data found for this scheme')

      meta.value = json.meta
      navRows.value = normalized
      lastFetchedAt.value = new Date().toISOString()

      await setCachedFund({
        schemeCode,
        fetchedAt: lastFetchedAt.value,
        meta: json.meta,
        navRows: normalized,
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      isLoading.value = false
    }
  }

  return {
    meta,
    navRows,
    latest,
    earliest,
    lastFetchedAt,
    isLoading,
    error,
    load,
    navOnOrBefore,
    navOnOrAfter,
  }
}
