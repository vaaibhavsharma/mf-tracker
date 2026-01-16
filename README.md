# Indian Mutual Fund Historical SIP Tracker (Vue 3 + Vite)

Single-page app that simulates historical SIP investing using **public NAV history** from https://www.mfapi.in/.

- Runs fully in the browser (no backend)
- Fetches NAV history once per fund and caches it in **IndexedDB**
- SIP rule: if NAV is missing on SIP date, uses the **previous available** NAV
- Outputs: invested, current value, P/L, absolute return, **XIRR**, charts, and a month-by-month table

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Data source

NAV data is fetched from:

- `https://www.mfapi.in/mf/{schemeCode}`

MFAPI dates are `DD-MM-YYYY`; the app converts them internally to ISO `YYYY-MM-DD`.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Code structure

- [src/composables/useNavData.js](src/composables/useNavData.js): fetch + normalize NAV history, IndexedDB cache, `navOnOrBefore()` lookup
- [src/composables/useSipCalculator.js](src/composables/useSipCalculator.js): SIP schedule generation, units/value tracking, cashflows, XIRR
- [src/utils/xirr.js](src/utils/xirr.js): XIRR implementation (Newton-Raphson + bisection fallback)
- [src/components](src/components): UI building blocks (fund list, SIP config, charts, table)
