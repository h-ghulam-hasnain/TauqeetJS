# TauqeetJS

**TauqeetJS** is a high-performance, modular, and headless-first TypeScript library for calculating Islamic prayer times and astronomical data. Designed for professional engineers, it prioritizes precision, type safety, and minimal bundle size.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/tauqeetjs)

---

## Key Features

- **Headless-First**: Import only the logic you need. No forced UI dependencies.
- **Type-Safe**: Written in TypeScript with exhaustive definitions.
- **Robust Error Handling**: Uses the `Result<T, E>` pattern—no silent failures or unexpected exceptions.
- **Environmentally Aware**: High-precision atmospheric refraction adjustments (elevation, temperature, pressure).
- **Small Footprint**: Zero external dependencies in the core engine.

---

## Quick Start

Install via your preferred package manager:

```bash
npm install tauqeet-js
# or
yarn add tauqeet-js
```

### Basic Usage (Low-Code)

Get prayer times for a specific location using smart defaults (Karachi method, Hanafi madhab).

```typescript
import { getPrayerTimes } from 'tauqeet-js';

const result = getPrayerTimes({
  location: { latitude: 24.8607, longitude: 67.0011 }
});

if (result.success) {
  const { fajr, dhuhr, asr, maghrib, isha } = result.data;
  console.log(`Fajr: ${fajr.toLocaleTimeString()}`);
} else {
  console.error(`Calculation failed: ${result.error}`);
}
```

---

## Core Concepts

### Headless-First Architecture

To keep your production bundle small, TauqeetJS is designed to be imported modularly. If you only need the prayer calculation engine without Qibla or Moon logic:

```typescript
import { getPrayerTimes } from 'tauqeetjs/prayer';
```

### The Result Pattern

Unlike libraries that throw errors or return `null`, TauqeetJS returns a `Result<T, E>` object. This ensures your application remains stable even with invalid inputs.

```typescript
const result = getPrayerTimes(config);

if (!result.success) {
  // result.error contains a descriptive string
  handleError(result.error);
} else {
  // result.data is fully typed
  renderUI(result.data);
}
```

---

## Advanced Configuration

Fine-tune calculations for specific environmental conditions or local preferences.

```typescript
const config = {
  location: { latitude: 24.86, longitude: 67.01, elevation: 20 },
  method: 'MWL',
  madhab: 'Hanafi',
  temperature: 25, // Celsius
  pressure: 1010,   // hPa/mbar
  adjustments: {
    fajr: 2, // Add 2 minutes
    maghrib: 1 // Add 1 minute (safety margin)
  }
};
```

---

## Documentation

For a full breakdown of the API, configuration options, and astronomical parameters, see [API.md](./API.md).
