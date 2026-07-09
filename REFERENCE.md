# tauqeet-js Reference

This reference covers the public API surface of tauqeet-js for version 1.1.3.

## Installation

```bash
npm install tauqeet-js
```

## Main Entry Point

```ts
import {
  calculatePrayerTimes,
  getQiblaDirection,
  getMoonPhase,
  toHijri,
  HijriMethod,
  getSunAtQibla,
} from 'tauqeet-js';
```

## Prayers

```ts
import { calculatePrayerTimes, getPrayerTimes, formatPrayerTimes } from 'tauqeet-js';

const result = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  timeZone: 'Europe/London',
  method: 'MWL',
});

const safeResult = getPrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  timeZone: 'Europe/London',
  method: 'MWL',
});
```

## Qibla

```ts
import { getQiblaDirection, getQiblaAdvanced, getQiblaDistance } from 'tauqeet-js';

const bearing = getQiblaDirection({ lat: 24.8607, lon: 67.0011 });
```

## Moon

```ts
import { getMoonPhase, getMoonAge, getMoonIllumination, checkVisibility } from 'tauqeet-js';

const phase = getMoonPhase(new Date());
const age = getMoonAge(new Date());
const illumination = getMoonIllumination(new Date());
```

## Hijri

```ts
import { toHijri, toGregorian, HijriMethod, HijriEngine } from 'tauqeet-js';

const hijri = toHijri(new Date(), HijriMethod.CIVIL);
const gregorian = toGregorian(hijri);
```

## Solar Alignment

```ts
import { getSunAtQibla } from 'tauqeet-js';

const alignment = getSunAtQibla({
  lat: 21.4225,
  lon: 39.8262,
  date: new Date(),
  timeZone: 'Asia/Riyadh',
});
```

## Astronomy Helpers

The main entry point also re-exports astronomy helpers such as:

```ts
import { calculateDeltaT, dateToJulianDay, computeSolarPosition } from 'tauqeet-js';
```

For full type definitions and method-specific options, see [API.md](API.md), [CONFIGURATION.md](CONFIGURATION.md), and [ERROR_HANDLING.md](ERROR_HANDLING.md).
