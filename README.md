# tauqeet-js: High-Precision Prayer Times & Qibla JavaScript Library

[![npm](https://img.shields.io/npm/v/tauqeet-js.svg)](https://www.npmjs.com/package/tauqeet-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/h-ghulam-hasnain/TauqeetJS/actions)
[![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)](https://github.com/h-ghulam-hasnain/TauqeetJS)
[![Bundle Size](https://img.shields.io/badge/bundle%20size-compact-success.svg)](https://www.npmjs.com/package/tauqeet-js)

> A high-precision prayer times and qibla calculation library for JavaScript and Node.js, built with TypeScript, VSOP87 solar ephemeris, and zero-dependency astronomy logic.

tauqeet-js is a precision prayer times JavaScript library for Islamic applications, web apps, and backend services. It provides high accuracy qibla calculation npm support, a VSOP87-based prayer times engine for Node.js, and a robust Islamic prayer time calculator library API for modern TypeScript projects.

## Why TauqeetJS

tauqeet-js is engineered for developers who need reliable astronomical calculations without the overhead of large, opinionated frameworks. The library focuses on two things exceptionally well:

- High-precision prayer time calculations with atmosphere-aware twilight modeling.
- High-accuracy qibla direction and distance calculations for the Kaaba.
- Zero-runtime dependencies and tree-shakeable subpath exports.
- TypeScript-native APIs for both ESM and CommonJS consumers.

## Key Features

- VSOP87-based solar ephemeris for improved astronomical precision.
- Zero dependencies for a lean installation footprint.
- Native TypeScript support with strong typing and modern module exports.
- Subpath exports for selective bundling: `tauqeet-js/prayers` and `tauqeet-js/qibla`.
- Built-in validation and structured error handling for production-grade integrations.

## Installation

```bash
npm install tauqeet-js
```

## Quick Start

### Prayers

```ts
import { calculatePrayerTimes } from 'tauqeet-js/prayers';

const result = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  date: '2026-01-01',
  method: 'MWL',
  madhab: 'Shafi',
  timeZone: 'Europe/London',
});

console.log(result.fajr.local);
console.log(result.dhuhr.local);
```

### Qibla

```ts
import { getQiblaDirection } from 'tauqeet-js/qibla';

const qibla = getQiblaDirection({ latitude: 51.5074, longitude: -0.1278 });
console.log(qibla.bearing);
```

## Why choose TauqeetJS over approximation-first libraries?

| Library | Approach | Precision | Best fit |
| --- | --- | --- | --- |
| tauqeet-js | VSOP87 solar ephemeris + atmospheric modeling | High | Mission-critical prayer times and qibla calculations |
| Adhan.js | Approximation-based methods | Moderate | General-purpose consumer apps |
| Simple prayer-time scripts | Basic angle formulas | Lower | Lightweight demos and prototypes |

## Documentation

- [API Reference](API/API.md)
- [Configuration Guide](API/CONFIGURATION.md)
- [Error Handling](API/ERROR_HANDLING.md)
- [Mathematics and Prayer Times](Logic/MATH_PRAYER_TIMES.md)
- [Performance Notes](Logic/PERFORMANCE.md)
- [Changelog](CHANGELOG.md)

## Project Structure

- `tauqeet-js/prayers` — prayer time calculations, timezone formatting, and metadata.
- `tauqeet-js/qibla` — qibla direction, bearing, distance, and sun alignment helpers.
- `src/astronomy` — solar ephemeris, orbital theory, and astronomical utilities.

## License

[MIT](LICENSE) © Ghulam Hasnain
