# 🌌 Tauqeet.js

**Tauqeet.js** is a high-precision, low-code JavaScript library for Islamic prayer times and astronomical ephemeris. Built on the gold-standard algorithms of **Jean Meeus**, it provides sub-second accuracy for global prayer times, solar/lunar positioning, and Qibla direction.

[![NPM Version](https://img.shields.io/npm/v/tauqeet-js)](https://www.npmjs.com/package/tauqeet-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Why Tauqeet.js?
In Urdu and Arabic, *Tauqeet* refers to the science of timekeeping, specifically for religious purposes. This library is designed to bring that ancient precision to the modern web with a focus on:
- **Sub-Second Precision:** Uses Successive Approximation loops for perfect convergence.
- **Topocentric Accuracy:** Accounts for refraction, solar semidiameter, parallax, and **Altitude (Elevation)**.
- **Low-Code API:** Get results in one line of code.
- **Robust:** Hardened against division-by-zero errors at poles and extreme latitudes.

## 🚀 Quick Start (One-Liner)

```javascript
import { calculate } from 'tauqeet-js';

// Get times for London (51.5, -0.1) using the Karachi method
const times = calculate(51.5074, -0.1278); 

console.log(times.fajr);
```

## 🛠️ Advanced Features

### 1. Elevation / Altitude Support
Tauqeet.js handles the "Dip of the Horizon" based on your vertical height.
```javascript
const times = calculate(31.4, 73.0, 'Karachi', 'Hanafi', new Date(), 1000); // 1000 meters elevation
```

### 2. High-Level Config
```javascript
import { getPrayerTimes } from 'tauqeet-js';

const schedule = getPrayerTimes({
  location: { latitude: 31.4, longitude: 73.0, elevation: 500 },
  method: 'MWL',
  madhab: 'Hanafi',
  date: new Date()
});
```

### 3. High-Precision Astronomy
Access coordinates for the Sun, Moon (including phases), and Polaris.
```javascript
import { AstronomyClass } from 'tauqeet-js';

const astro = new AstronomyClass();
console.log(astro.moon.illumination); // Current moon phase %
console.log(astro.sun.GHA);           // Sun Greenwich Hour Angle
```

### 4. Qibla Direction
Calculates Great Circle bearing and Distance to Makkah.
```javascript
import { calculateQibla } from 'tauqeet-js';

const qibla = calculateQibla({ latitude: 31.4, longitude: 73.0 });
console.log(qibla.bearing);  // Bearing from North
console.log(qibla.distance); // KM to Kaaba
```

## 📐 Accuracy Benchmark
This library aligns with:
- **Astro-Almanac HP** (Henning Umland)
- **Jean Meeus** (Astronomical Algorithms)
- **Islamic Standard Methods** (Karachi, MWL, ISNA, Egypt, Tehran, Jafari, Makkah)

## 📄 License
MIT © 2026 Ghulam Hasnain.
