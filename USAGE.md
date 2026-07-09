# Usage Guide

This guide provides practical examples for the most common tauqeet-js workflows.

## Quick Start

```ts
import { calculatePrayerTimes } from 'tauqeet-js';

const prayerTimes = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  timeZone: 'Europe/London',
  method: 'MWL',
});

console.log(prayerTimes.fajr.local);
```

## Prayer Times

### Basic Example

```ts
const result = calculatePrayerTimes({
  lat: 24.8607,
  long: 67.0011,
  date: new Date('2024-04-27'),
  timeZone: 'Asia/Karachi',
  method: 'Karachi',
});
```

### Safe Result Pattern

```ts
import { getPrayerTimes } from 'tauqeet-js';

const safeResult = getPrayerTimes({
  lat: 24.8607,
  long: 67.0011,
  timeZone: 'Asia/Karachi',
});

if (safeResult.success) {
  console.log(safeResult.data.fajr.local);
} else {
  console.error(safeResult.error);
}
```

## Qibla Direction

```ts
import { getQiblaDirection } from 'tauqeet-js';

const direction = getQiblaDirection({ lat: 33.6844, lon: 73.0479 });
console.log(direction.bearing);
```

## Moon and Visibility

```ts
import { getMoonPhase, getMoonIllumination, checkVisibility } from 'tauqeet-js';

const phase = getMoonPhase(new Date());
const illumination = getMoonIllumination(new Date());
```

## Hijri Calendar

```ts
import { toHijri, HijriMethod } from 'tauqeet-js';

const hijri = toHijri(new Date(), HijriMethod.CIVIL);
console.log(hijri.year, hijri.month, hijri.day);
```

## High-Latitude Locations

```ts
import { calculatePrayerTimes } from 'tauqeet-js';

const result = calculatePrayerTimes({
  lat: 59.9139,
  long: 10.7522,
  timeZone: 'Europe/Oslo',
  method: 'MWL',
  highLatitudeStrategy: 'AngleBased',
});

if (result.fajr.status !== 'SUCCESS') {
  console.warn('Fajr is undefined for this date and location.');
}
```

## Further Reading

- [README.md](README.md)
- [API.md](API.md)
- [CONFIGURATION.md](CONFIGURATION.md)
- [ERROR_HANDLING.md](ERROR_HANDLING.md)
- [PERFORMANCE.md](PERFORMANCE.md)
