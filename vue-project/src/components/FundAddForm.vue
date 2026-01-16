<script setup>
import { computed, ref, watch } from 'vue'

const emit = defineEmits(['add'])

const schemeCode = ref('')

const query = ref('')
const isSearching = ref(false)
const searchError = ref(null)
const results = ref([])
let searchTimer = null

const showResults = computed(() => query.value.trim().length >= 3)

async function runSearch(q) {
  const term = q.trim()
  if (term.length < 3) {
    results.value = []
    return
  }
  isSearching.value = true
  searchError.value = null
  try {
    const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(term)}`)
    if (!res.ok) throw new Error(`Search error (${res.status})`)
    const json = await res.json()
    results.value = Array.isArray(json) ? json.slice(0, 10) : []
  } catch (e) {
    searchError.value = e instanceof Error ? e.message : String(e)
    results.value = []
  } finally {
    isSearching.value = false
  }
}

watch(
  query,
  (v) => {
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => runSearch(v), 250)
  },
  { flush: 'post' },
)

function submit() {
  const code = schemeCode.value.trim()
  if (!code) return
  emit('add', code)
  schemeCode.value = ''
}

function addFromResult(r) {
  if (!r?.schemeCode) return
  emit('add', String(r.schemeCode))
  query.value = ''
  results.value = []
}
</script>

<template>
  <form class="card" @submit.prevent="submit">
    <div class="card__title">Add mutual fund</div>

    <div class="field">
      <label class="label" for="fundSearch">Search by name</label>
      <input
        id="fundSearch"
        v-model="query"
        class="input"
        autocomplete="off"
        placeholder="Type 3+ chars (e.g. Parag Parikh Flexi Cap)"
      />

      <div v-if="showResults" class="search">
        <div v-if="isSearching" class="hint" style="padding: 8px 10px">Searching…</div>
        <div v-else-if="searchError" class="hint" style="padding: 8px 10px">{{ searchError }}</div>
        <button
          v-for="r in results"
          :key="r.schemeCode"
          class="search__item"
          type="button"
          @click="addFromResult(r)"
        >
          <div class="search__name">{{ r.schemeName }}</div>
          <div class="search__code">{{ r.schemeCode }}</div>
        </button>
        <div v-if="!isSearching && !searchError && !results.length" class="hint" style="padding: 8px 10px">
          No results.
        </div>
      </div>

      <div class="hint">Adds the selected scheme code automatically.</div>
    </div>

    <div class="divider">or</div>

    <div class="field">
      <label class="label" for="schemeCode">Scheme code</label>
      <input
        id="schemeCode"
        v-model="schemeCode"
        class="input"
        inputmode="numeric"
        autocomplete="off"
        placeholder="e.g. 118834"
      />
      <div class="hint">
        Find a scheme code on mfapi.in or from your fund’s factsheet.
      </div>
    </div>
    <button class="btn btn--primary" type="submit">Add fund</button>
  </form>
</template>

<style scoped>
.divider {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.search {
  margin-top: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}
.search__item {
  width: 100%;
  text-align: left;
  background: #fff;
  border: 0;
  border-top: 1px solid var(--border);
  padding: 10px;
  cursor: pointer;
}
.search__item:first-child {
  border-top: 0;
}
.search__item:hover {
  background: rgba(17, 24, 39, 0.03);
}
.search__name {
  font-size: 12px;
  font-weight: 650;
}
.search__code {
  font-size: 12px;
  color: var(--muted);
}
</style>
