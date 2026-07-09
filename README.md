# tauqeet-js

A high-precision TypeScript library for Islamic astronomical calculations, covering prayer times, Qibla direction, lunar events, Hijri conversion, and solar alignment.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-1.1.3-blue.svg)](CHANGELOG.md)

> Interactive reference: [https://tauqeet-js.web.app](https://tauqeet-js.web.app)

tauqeet-js provides numerically precise astronomical calculations using a VSOP87-based solar ephemeris, lunar theory, and ΔT corrections. The package is modular and tree-shakeable, so Node.js and browser applications can import only the modules they need.

---

## What is tauqeet-js?

tauqeet-js is a TypeScript-first library for Islamic astronomy. It helps applications compute:

- Prayer times for major prayer events such as Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha.
- Qibla direction and distance to Mecca.
- Moon phase, moon age, lunar events, and visibility heuristics.
- Hijri calendar conversions and calendar-method helpers.
- Solar alignment events relative to the Qibla bearing.

The current release, v1.1.3, focuses on stable public exports, stronger validation, better diagnostics around timezone and formatting fallbacks, and measurable runtime improvements.

---

## Installation

Install with your preferred package manager:

```bash
npm install tauqeet-js
```

```bash
yarn add tauqeet-js
```

```bash
pnpm add tauqeet-js
```

The package ships ESM and CommonJS entry points, with per-module subpath exports for selective bundling.

---

## Quick Start

```ts
import { calculatePrayerTimes } from 'tauqeet-js';

const result = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  timeZone: 'Europe/London',
  method: 'MWL',
  madhab: 'Shafi',
});

console.log(result.fajr.local);
console.log(result.dhuhr.local);
console.log(result.isha.local);
```

For a more resilient integration, see [API.md](API.md) and [ERROR_HANDLING.md](ERROR_HANDLING.md).

---

## Core Modules

| Module | What it provides |
|---|---|
| Prayers | Prayer-time calculations, formatting helpers, config validation, high-latitude handling |
| Qibla | Bearing and distance to the Kaaba |
| Moon | Phase, age, lunar events, crescent visibility heuristics |
| Hijri | Gregorian/Hijri conversion and calendar methods |
| Solar Alignment | Sun-at-Qibla alignment times |

---

## Documentation Set

- [API.md](API.md) — comprehensive API reference for public exports.
- [ERROR_HANDLING.md](ERROR_HANDLING.md) — error classes, Result wrappers, and diagnostics.
- [CONFIGURATION.md](CONFIGURATION.md) — prayer configuration, methods, high-latitude strategies, and timezone hooks.
- [PERFORMANCE.md](PERFORMANCE.md) — ephemerides, models, optimisations, and benchmarks.
- [CHANGELOG.md](CHANGELOG.md) — release notes and migration guidance.

---

## Highlights in v1.1.3

- Per-module exports for tree-shaking: [API.md](API.md)
- Optional fallback diagnostics for timezone and formatting issues
- More explicit validation for custom prayer angles
- Performance improvements in the astronomy hot path
- Improved error handling around timezone formatting and visibility calculations

---

## License

[MIT](LICENSE) © Ghulam Hasnain
