<script setup>
import { ref, watch, computed } from 'vue'
import { RouterLink } from 'vue-router'

import { useNavData } from '../composables/useNavData'
import { useSipCalculator } from '../composables/useSipCalculator'
import { formatINR, formatNumber, formatPct } from '../utils/date'

import SipConfigForm from './SipConfigForm.vue'

const props = defineProps({
  schemeCode: { type: String, required: true },
  sipConfig: { type: Object, required: true },
  selected: { type: Boolean, default: true },
})

const emit = defineEmits(['updateSipConfig', 'loaded-meta', 'metrics'])

const schemeCodeRef = ref(props.schemeCode)
watch(
  () => props.schemeCode,
  (v) => (schemeCodeRef.value = v),
)

const { meta, latest, earliest, isLoading, error, load, navOnOrBefore, navOnOrAfter } =
  useNavData(schemeCodeRef)

watch(
  meta,
  (m) => {
    if (m?.scheme_name) emit('loaded-meta', { schemeCode: props.schemeCode, name: m.scheme_name })
  },
  { immediate: true },
)

watch(
  () => props.schemeCode,
  () => load(),
  { immediate: true },
)

const sipConfigRef = computed(() => props.sipConfig)
const { validationError, summary, chartSeries, cashflows } = useSipCalculator(
  { navOnOrBefore, navOnOrAfter, latest, earliest },
  sipConfigRef,
)

const displayName = computed(() => meta.value?.scheme_name || props.schemeCode)

watch(
  [displayName, summary, chartSeries, cashflows],
  () => {
    emit('metrics', {
      schemeCode: props.schemeCode,
      name: displayName.value,
      summary: summary.value,
      cashflows: cashflows.value,
      series: chartSeries.value,
    })
  },
  { deep: true },
)
</script>

<template>
  <section class="card" :class="{ muted: !selected }">
    <div class="head">
      <div class="titleWrap">
        <div class="title">
          {{ displayName }}
          <RouterLink class="link" :to="`/fund/${schemeCode}`">Details →</RouterLink>
        </div>
        <div class="sub">
          <span>Scheme: {{ schemeCode }}</span>
          <span v-if="latest">Latest NAV: ₹{{ formatNumber(latest.nav, 4) }} ({{ latest.dateISO }})</span>
        </div>
      </div>

      <div class="right">
        <div class="mini">
          <div class="mini__label">Value</div>
          <div class="mini__value">{{ formatINR(summary.currentValue) }}</div>
        </div>
        <div class="mini">
          <div class="mini__label">XIRR</div>
          <div class="mini__value">{{ summary.xirrPct == null ? '—' : formatPct(summary.xirrPct) }}</div>
        </div>
      </div>
    </div>

    <div v-if="error" class="alert alert--danger">{{ error }}</div>
    <div v-else-if="isLoading" class="hint">Loading NAV…</div>

    <template v-else>
      <SipConfigForm
        :scheme-code="schemeCode"
        :model-value="sipConfig"
        @update:model-value="(v) => emit('updateSipConfig', { schemeCode, patch: v })"
      />

      <div v-if="validationError" class="alert alert--warning" style="margin-top: 10px">
        {{ validationError }}
      </div>
    </template>
  </section>
</template>

<style scoped>
.muted {
  opacity: 0.65;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.title {
  font-weight: 720;
  letter-spacing: -0.01em;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: baseline;
}
.link {
  font-size: 12px;
  color: rgba(17, 24, 39, 0.7);
  text-decoration: none;
  border-bottom: 1px solid rgba(17, 24, 39, 0.2);
}
.sub {
  margin-top: 3px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--muted);
  font-size: 12px;
}
.right {
  display: flex;
  gap: 12px;
}
.mini__label {
  font-size: 12px;
  color: var(--muted);
  text-align: right;
}
.mini__value {
  font-weight: 700;
  text-align: right;
}
</style>
