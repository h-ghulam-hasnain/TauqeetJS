# tauqeet-js

**A high-precision TypeScript library for Islamic astronomical calculations.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue.svg)](https://www.typescriptlang.org/)

> 📖 **Interactive documentation & live API explorer:** [https://tauqeet-js.web.app](https://tauqeet-js.web.app)

`tauqeet-js` (تَوقِيت — Arabic for "timing") provides high-fidelity Islamic astronomical computation powered by a full VSOP87-derived solar ephemeris, lunar theory, and ΔT correction. It is modular by design — import only the feature you need.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Limitations & Performance](#limitations--performance)
- [Modules Overview](#modules-overview)
- [License](#license)
- [Author](#author)

---

## Features

| Module | Capability |
|---|---|
| **Prayers** | Fajr, Sunrise, Ḍuḥā, Dhuhr, Asr, Maghrib, Isha with 8 built-in calculation methods |
| **Qibla** | Great-circle bearing, rhumb-line bearing, and distance to the Kaaba |
| **Moon** | Phase, illumination, age, lunar events, crescent visibility (Odeh / Yallop / HMNAO) |
| **Hijri** | Gregorian ↔ Hijri conversion via Civil, Conjunction, Visibility, or Umm al-Qura methods |
| **Solar Alignment** | Times when the sun aligns with the Qibla direction (useful for compass calibration) |

---

## Prerequisites

- **Node.js** ≥ 18
- **TypeScript** ≥ 5 (for source usage)
- ESM-first; CJS bundle also provided.

---

## Installation

```bash
npm install tauqeet-js
```

> **Note:** The package is currently in active development. See [CONTRIBUTING.md](CONTRIBUTING.md) for building from source.

---

## Quick Start

### Prayer Times

```ts
import { calculatePrayerTimes, BUILT_IN_METHODS } from 'tauqeet-js';

// London, UK – today
const result = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  timeZone: 'Europe/London',
  method: 'MWL',         // Muslim World League
  madhab: 'Shafi',
});

console.log(result.fajr.local);    // e.g. "03:41 AM"
console.log(result.dhuhr.local);   // e.g. "01:05 PM"
console.log(result.isha.local);    // e.g. "10:52 PM"
```

### Qibla Direction

```ts
import { getQiblaDirection } from 'tauqeet-js';

const qibla = getQiblaDirection({ latitude: 51.5074, longitude: -0.1278 });
console.log(`Bearing to Kaaba: ${qibla.bearing?.toFixed(2)}°`);
console.log(`Distance: ${qibla.distanceKm.toFixed(0)} km`);
```

### Moon Phase

```ts
import { getMoonPhase, getMoonAge } from 'tauqeet-js';

const phase = getMoonPhase(new Date());
console.log(`Phase: ${phase.phaseName}`);           // e.g. "Waxing Crescent"
console.log(`Illumination: ${(phase.illuminatedFraction * 100).toFixed(1)}%`);

const age = getMoonAge(new Date());
console.log(`Moon age: ${age.ageDays.toFixed(1)} days`);
```

### Hijri Date Conversion

```ts
import { toHijri, HijriMethod, HIJRI_MONTH_NAMES } from 'tauqeet-js';

const hijri = toHijri(new Date(), HijriMethod.CIVIL);
console.log(`${hijri.day} ${HIJRI_MONTH_NAMES[hijri.month - 1]} ${hijri.year} AH`);
```

---

## Documentation

| File | Description |
|---|---|
| [API.md](API.md) | API reference index to all modules, types, and classes |
| [docs/](docs/) | Detailed module-specific API documentation (Prayers, Qibla, Moon, Hijri) |
| [USAGE.md](USAGE.md) | Practical code guides with real-world examples |
| [MODULES.md](MODULES.md) | Architecture overview and module import guide |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Build, test, and contribution guidelines |

For the most up-to-date, interactive reference visit **[https://tauqeet-js.web.app](https://tauqeet-js.web.app)**.

---

## Limitations & Performance

This library prioritizes numerical precision and scientific correctness. A few important limitations and runtime considerations you should know before integrating `tauqeet-js` into production systems:

- ΔT model year range: the internal ΔT model is valid for years in the approximate range -2000..3000. Calls that request ephemerides or event searches outside this range will throw a `RangeError`. If you need values outside this range, pre-warn users and validate inputs.

- Heavy numerical work: functions that evaluate full ephemerides (VSOP87 series, lunar theory) and global/local eclipse searches perform significant floating-point work and are synchronous. Run these calls off the main event loop (worker threads / web workers) in latency-sensitive applications.

- Search convergence: several search routines (eclipse finders, lunar event searches) use iterative searches with configurable limits (e.g., `maxMoons`). When a search does not converge within the configured limit the function throws a `SearchConvergenceError`. You should catch this error or use the `get*` Result-style APIs where available.

- Bundle size & coefficients: the VSOP87 coefficient tables are intentionally large to retain full precision. Importing the astronomy internals can increase bundle size and memory usage. For browser usage, consider server-side precomputation or dynamically importing astronomy modules only when needed.

- Timezone & Intl: named timezone formatting depends on Node's ICU data. On some CI or minimal Node builds, Intl may not support IANA timezone names; to avoid discrepancies provide a `resolveTimezoneAsync` hook or run tests/environments with full-icu support.

Refer to `API.md` and `docs/` for error types, configuration knobs, and recommended usage patterns for heavy computations.

---

## Modules Overview

```
tauqeet-js
├── prayers/          Prayer time engine (8 methods, high-latitude strategies)
├── qibla/            Qibla bearing & distance to Mecca
├── moon/             Moon phase, age, events, crescent visibility
├── hijri/            Gregorian ↔ Hijri calendar conversion
├── solar-alignment/  Sun-at-Qibla times
└── astronomy/        Internal ephemeris (VSOP87, lunar theory, ΔT) — private
```

See [MODULES.md](MODULES.md) for a detailed dependency graph and tree-shaking guide.

---

## License

[MIT](LICENSE) © Ghulam Hasnain
