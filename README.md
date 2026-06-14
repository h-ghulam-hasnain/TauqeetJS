# TauqeetJS

**TauqeetJS** is a high-performance, modular, and headless-first TypeScript library for calculating Islamic prayer times, Qibla direction, and moon data. Designed for professional applications, it prioritizes precision, tree-shakability, and robust error handling.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Bundle Size](https://img.shields.io/bundlephobia/minzip/tauqeet-js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)

---

## 🚀 Key Features

- **Modular & Tree-Shakable**: Import only what you need (e.g., just Qibla logic) to keep your bundles lean.
- **Headless-First**: 100% logic-based. No DOM dependencies or CSS injections.
- **High Precision**: Built on rigorous astronomical algorithms (Meeus) with atmospheric corrections and iteration convergence.
- **Robust Error Handling**: Uses the `Result<T, E>` pattern—no silent failures or unexpected exceptions.
- **Deep Metadata**: Access internal astronomical values (DEC, EOT, SD, HP) used in calculations via the metadata flag.

---

## 📦 Installation

```bash
npm install tauqeet-js
```

---

## 💡 Quick Start

### Basic Prayer Times
```typescript
import { getPrayerTimes } from 'tauqeet-js';

const result = getPrayerTimes({
  location: { latitude: 24.8607, longitude: 67.0011 },
  withMetadata: true // Optional: returns astronomical primitives
});

if (result.success) {
  const { fajr, dhuhr, asr, maghrib, isha } = result.data;
  console.log(`Fajr: ${fajr.toISOString()}`);
}
```

### Modular Imports (Better Tree-Shaking)
If you only need specific logic, import from sub-paths:

```typescript
import { calculateQibla } from 'tauqeet-js/qibla';
import { getMoonVisibility } from 'tauqeet-js/moon-visibility';
```

---

## � Ramadan Schedule
```typescript
import { getRamadanSchedule } from 'tauqeet-js';

const result = getRamadanSchedule(
  new Date(2026, 2, 1),
  new Date(2026, 2, 29),
  { location: { latitude: 25.2048, longitude: 55.2708 }, method: 'MWL' },
  30, // sahur buffer in minutes
  2,  // iftar buffer in minutes
);

if (result.success) {
  result.data.forEach((day) => {
    console.log(day.date, day.sahurEndsAt.local, day.iftarAt.local);
  });
}
```

---

## �🌍 TimeZone Handling Guide

TauqeetJS follows a **Strict UTC Internal Pattern** to maintain astronomical precision.

### 1. Internal Pattern
All internal calculations (Julian Dates, Ephemeris Time, and Solvers) are performed in **UTC/TDT**. The library does not "know" about local time during the calculation phase.

### 2. Input Dates
When passing a `Date` object to the library, it is treated as a UTC reference point for the calculation day.
```typescript
const date = new Date(); // Current system time, but used as a UTC reference
```

### 3. Local Conversion (Output Layer)
The transformation to local time happens **only at the final formatting/output layer**. The `format()` method on the result object should be used with an IANA timezone string.

```typescript
const result = getPrayerTimes(config);

if (result.success) {
  // Format to a specific IANA TimeZone
  const times = result.data.format('24h', 'Asia/Karachi');
  console.log(times.fajr); // "04:15:22"
}
```

### 4. Handling DST and Offsets
Since the library utilizes the browser/Node.js `Intl.DateTimeFormat` engine, it automatically handles **Daylight Saving Time (DST)** transitions based on the IANA timezone provided.
- **Avoid Manual Offsets**: It is recommended to use IANA names (e.g., `Europe/London`) rather than manual UTC offsets to ensure DST transitions are handled correctly by the underlying platform.

---

## 📖 Documentation

Detailed API documentation and metadata strict mapping can be found in [API.md](./API.md).

## 📄 License
MIT © [Ghulam Hasnain](https://github.com/h-ghulam-hasnain)

