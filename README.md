# tauqeet-js

A premium, enterprise-grade TypeScript engine for high-precision Islamic astronomical calculations. Exclusively specialized in highly accurate Prayer Times and Qibla direction, powered by the robust VSOP87 planetary theory.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/version-1.1.3-blue.svg)](CHANGELOG.md)

> Interactive reference: [https://tauqeet-js.web.app](https://tauqeet-js.web.app)

tauqeet-js provides numerically precise astronomical calculations using a VSOP87-based solar ephemeris, atmospheric refraction modeling, and strict mathematical validations. Designed for mission-critical applications where accuracy and predictability are paramount, the package is extremely focused and tree-shakeable, exporting only two core modules.

---

## What makes tauqeet-js enterprise-grade?

tauqeet-js is a TypeScript-first library built specifically for platforms demanding uncompromising astronomical accuracy. It provides:

- **Mathematical Precision:** Utilizing the complete VSOP87 planetary theory and IAU2000B models, avoiding the approximations found in simpler libraries.
- **Atmospheric Modeling:** Dynamic adjustment of visible twilight and sunset times based on real-time temperature and barometric pressure.
- **Strict Validation:** Unbreakable coordinate and input boundaries that throw deterministic `InvalidArgumentError`s *before* evaluating flawed geometry.
- **High-Latitude Resilience:** Advanced, continuous-twilight fallback strategies and intelligent polar-day/night projection mappings.

The current release focuses on a hyper-optimized architecture, shipping exclusively two core domains: Prayer and Qibla.

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
import { calculatePrayerTimes } from 'tauqeet-js/prayers';
import { getQiblaDirection } from 'tauqeet-js/qibla';

const prayerResult = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  timeZone: 'Europe/London',
  method: 'MWL',
  madhab: 'Shafi',
});

console.log('Fajr:', prayerResult.fajr.local);
console.log('Dhuhr:', prayerResult.dhuhr.local);

const qiblaResult = getQiblaDirection({ latitude: 51.5074, longitude: -0.1278 });
console.log('Qibla Bearing:', qiblaResult.bearing);
```

For a more resilient integration, see [API.md](API.md) and [ERROR_HANDLING.md](ERROR_HANDLING.md).

---

## Core Modules

| Module | What it provides |
|---|---|
| `tauqeet-js/prayers` | Robust prayer-time calculations, timezone formatting, deep configuration validation, and high-latitude management. |
| `tauqeet-js/qibla` | Exact great-circle bearing, rhumb-line bearing, and highly accurate geographical distances to the Kaaba. |

---

## Documentation Set

- [API.md](API.md) — comprehensive API reference for public exports.
- [ERROR_HANDLING.md](ERROR_HANDLING.md) — error classes, Result wrappers, and diagnostics.
- [CONFIGURATION.md](CONFIGURATION.md) — prayer configuration, methods, high-latitude strategies, and timezone hooks.
- [PERFORMANCE.md](PERFORMANCE.md) — ephemerides, models, optimisations, and benchmarks.
- [CHANGELOG.md](CHANGELOG.md) — release notes and migration guidance.

---

## Highlights in the Latest Release

- **Hyper-Focused Architecture:** Removed bloated lunar and calendar engines to focus exclusively on highly precise Solar/Prayer and Qibla dynamics.
- **Enterprise-Grade Validation:** Added impenetrable boundary guards that immediately throw `InvalidArgumentError` for invalid or NaN coordinates.
- **Strict Module Exports:** `tauqeet-js/prayers` and `tauqeet-js/qibla` are now the only entry points for optimal bundler resolution and tree-shaking.
- **Unrivaled Astronomical Precision:** Kept the heavy VSOP87 models required for exact solar ephemeris and planetary transits.

---

## License

[MIT](LICENSE) © Ghulam Hasnain
