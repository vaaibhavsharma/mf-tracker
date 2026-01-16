<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePortfolioState } from '../composables/usePortfolioState'

import FundPanel from '../components/FundPanel.vue'

const route = useRoute()
const router = useRouter()

const schemeCode = computed(() => String(route.params.schemeCode || '').trim())

const { sipConfigsByScheme, updateSipConfig, addFund } = usePortfolioState()

// Ensure the fund exists in local state when visiting deep links.
if (schemeCode.value) addFund(schemeCode.value)
</script>

<template>
  <div class="detail">
    <div class="top">
      <button class="btn btn--ghost" type="button" @click="router.push('/')">← Back</button>
      <div class="hint">Per-fund details: summary, chart and SIP table.</div>
    </div>

    <FundPanel
      v-if="schemeCode"
      :scheme-code="schemeCode"
      :sip-config="sipConfigsByScheme[schemeCode]"
      :selected="true"
      @updateSipConfig="({ schemeCode: sc, patch }) => updateSipConfig(sc, patch)"
    />
  </div>
</template>

<style scoped>
.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
</style>
