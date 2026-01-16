<script setup>
import { computed, ref } from 'vue'
import { formatINR, formatNumber } from '../utils/date'

const props = defineProps({
  rows: { type: Array, required: true },
})

const isOpen = ref(false)

const visibleRows = computed(() => (isOpen.value ? props.rows : props.rows.slice(-12)))
</script>

<template>
  <div class="card">
    <div class="card__title" style="display: flex; justify-content: space-between; align-items: center">
      <span>SIP table</span>
      <button class="btn btn--ghost" type="button" @click="isOpen = !isOpen">
        {{ isOpen ? 'Show last 12' : 'Show all' }}
      </button>
    </div>

    <div class="tableWrap">
      <table class="table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Scheduled</th>
            <th>NAV date used</th>
            <th class="num">NAV</th>
            <th class="num">SIP</th>
            <th class="num">Units bought</th>
            <th class="num">Cumulative units</th>
            <th class="num">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in visibleRows" :key="r.monthIndex">
            <td>{{ r.monthIndex + 1 }}</td>
            <td>{{ r.scheduledISO }}</td>
            <td>{{ r.navDateISO }}</td>
            <td class="num">{{ formatNumber(r.nav, 4) }}</td>
            <td class="num">{{ formatINR(r.sipAmount) }}</td>
            <td class="num">{{ formatNumber(r.unitsBought, 4) }}</td>
            <td class="num">{{ formatNumber(r.cumulativeUnits, 4) }}</td>
            <td class="num">{{ formatINR(r.value) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="hint" style="margin-top: 10px">
      NAV execution rule: if NAV is missing on the SIP date, the previous available NAV is used.
    </div>
  </div>
</template>

<style scoped>
.tableWrap {
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
th,
td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
th {
  text-align: left;
  color: var(--muted);
  font-weight: 600;
  background: var(--panel);
}
.num {
  text-align: right;
}
</style>
