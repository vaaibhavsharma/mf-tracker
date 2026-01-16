<script setup>
const props = defineProps({
  funds: { type: Array, required: true },
  selected: { type: Array, required: true },
})

const emit = defineEmits(['toggle', 'remove'])
</script>

<template>
  <div class="card">
    <div class="card__title">Funds</div>

    <div v-if="!funds.length" class="empty">
      Add one or more funds to start.
    </div>

    <ul v-else class="list">
      <li v-for="f in funds" :key="f.schemeCode" class="list__item">
        <label class="list__main">
          <input
            type="checkbox"
            class="checkbox"
            :checked="selected.includes(f.schemeCode)"
            @change="emit('toggle', f.schemeCode)"
          />
          <div class="list__meta">
            <div class="list__title">{{ f.name || f.schemeCode }}</div>
            <div class="list__sub">{{ f.schemeCode }}</div>
          </div>
        </label>

        <button class="btn btn--ghost btn--danger" type="button" @click="emit('remove', f.schemeCode)">
          Remove
        </button>
      </li>
    </ul>

    <div class="hint" style="margin-top: 10px">
      Tip: tick multiple funds to compare performance.
    </div>
  </div>
</template>
