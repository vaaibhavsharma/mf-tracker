<script setup>
import { computed } from 'vue'

const props = defineProps({
  schemeCode: { type: String, required: true },
  modelValue: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const amount = computed({
  get: () => props.modelValue.amount,
  set: (v) => emit('update:modelValue', { ...props.modelValue, amount: Number(v) }),
})

const startDateISO = computed({
  get: () => props.modelValue.startDateISO,
  set: (v) => emit('update:modelValue', { ...props.modelValue, startDateISO: v }),
})

const endDateISO = computed({
  get: () => props.modelValue.endDateISO || '',
  set: (v) => emit('update:modelValue', { ...props.modelValue, endDateISO: v }),
})

const stepUpPctAnnual = computed({
  get: () => props.modelValue.stepUpPctAnnual ?? 0,
  set: (v) => emit('update:modelValue', { ...props.modelValue, stepUpPctAnnual: Number(v) }),
})

const executionRule = computed({
  get: () => props.modelValue.executionRule ?? 'next',
  set: (v) => emit('update:modelValue', { ...props.modelValue, executionRule: v }),
})
</script>

<template>
  <div class="card">
    <div class="card__title">SIP configuration</div>

    <div class="formGrid">
      <div class="field">
        <label class="label">SIP amount (₹)</label>
        <input class="input" type="number" min="1" step="1" v-model="amount" :disabled="disabled" />
      </div>

      <div class="field">
        <label class="label">SIP start date</label>
        <!-- Using a native date input gives an unambiguous ISO date; we store it as YYYY-MM-DD -->
        <input class="input" type="date" v-model="startDateISO" :disabled="disabled" />
        <div class="hint">Monthly SIP executes on the day-of-month of your start date.</div>
      </div>

      <div class="field">
        <label class="label">SIP end date (optional)</label>
        <input class="input" type="date" v-model="endDateISO" :disabled="disabled" />
        <div class="hint">Defaults to today. Set an earlier end date to stop SIPs.</div>
      </div>

      <div class="field">
        <label class="label">Frequency</label>
        <input class="input" value="Monthly" disabled />
      </div>

      <div class="field">
        <label class="label">Step-up (annual %)</label>
        <input
          class="input"
          type="number"
          min="0"
          step="0.5"
          v-model="stepUpPctAnnual"
          :disabled="disabled"
          placeholder="e.g. 10"
        />
        <div class="hint">Increases SIP amount every 12 months.</div>
      </div>

      <div class="field">
        <label class="label">Execution rule</label>
        <select class="input" v-model="executionRule" :disabled="disabled">
          <option value="next">If NAV missing, use next available NAV</option>
          <option value="previous">If NAV missing, use previous available NAV</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.formGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 860px) {
  .formGrid {
    grid-template-columns: 1fr;
  }
}
</style>
