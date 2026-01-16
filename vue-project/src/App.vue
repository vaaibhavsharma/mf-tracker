<script setup></script>

<template>
  <div class="app">
    <header class="topbar">
      <div>
        <div class="brand">Mutual Fund Historical SIP Tracker</div>
        <div class="subtitle">Browser-only • mfapi.in NAV history • IndexedDB cached</div>
      </div>
    </header>

    <router-view />
  </div>
</template>

<style scoped>
.app {
  display: grid;
  gap: 12px;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 6px 0;
}
.brand {
  font-size: 20px;
  font-weight: 720;
  letter-spacing: -0.02em;
}
.subtitle {
  color: var(--muted);
  font-size: 12px;
}
</style>
