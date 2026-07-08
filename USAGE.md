# Usage Guide

> **Latest interactive examples:** [https://tauqeet-js.web.app](https://tauqeet-js.web.app)

Practical, copy-paste-ready examples covering the most common use cases for `tauqeet-js`.

---

## Table of Contents

1. [Prayer Times for a City](#1-prayer-times-for-a-city)
   - [Basic Usage](#11-basic-usage)
   - [Choosing a Calculation Method](#12-choosing-a-calculation-method)
   - [Custom Method](#13-custom-method)
   - [Hanafi Asr](#14-hanafi-asr)
   - [Formatting Output](#15-formatting-output)
   - [Adding Minute Adjustments](#16-adding-minute-adjustments)
   - [Async Timezone Resolution](#17-async-timezone-resolution)
   - [Metadata / Debug Mode](#18-metadata--debug-mode)
   - [High-Latitude Locations](#19-high-latitude-locations)
2. [Qibla Direction](#2-qibla-direction)
   - [Basic Bearing & Distance](#21-basic-bearing--distance)
   - [Rhumb-Line Bearing](#22-rhumb-line-bearing)
   - [Sun-at-Qibla Times](#23-sun-at-qibla-times)
3. [Moon Module](#3-moon-module)
   - [Moon Phase & Illumination](#31-moon-phase--illumination)
   - [Moon Age](#32-moon-age)
   - [Lunar Events](#33-lunar-events)
   - [Crescent Visibility (Single Method)](#34-crescent-visibility-single-method)
   - [Crescent Visibility (All Methods)](#35-crescent-visibility-all-methods)
4. [Hijri Calendar](#4-hijri-calendar)
   - [Gregorian → Hijri (Civil)](#41-gregorian--hijri-civil)
   - [Gregorian → Hijri (Conjunction)](#42-gregorian--hijri-conjunction)
   - [Gregorian → Hijri (Visibility)](#43-gregorian--hijri-visibility)
   - [Gregorian → Hijri (Umm al-Qura)](#44-gregorian--hijri-umm-al-qura)
   - [Hijri → Gregorian](#45-hijri--gregorian)
   - [Calendar Month Grid](#46-calendar-month-grid)
5. [Error Handling](#5-error-handling)

---

## 1. Prayer Times for a City

> 📖 **API Reference:** [docs/prayers.md](docs/prayers.md)

### 1.1 Basic Usage

**Get Fajr time for London on 9 April 2024:**

```ts
import { calculatePrayerTimes } from 'tauqeet-js';

const result = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  date: new Date('2024-04-09'),
  timeZone: 'Europe/London',
  method: 'MWL',
});

console.log('Fajr  :', result.fajr.local);    // "04:00 AM"
console.log('Sunrise:', result.sunrise.local);
console.log('Dhuhr :', result.dhuhr.local);
console.log('Asr   :', result.asr.local);
console.log('Maghrib:', result.maghrib.local);
console.log('Isha  :', result.isha.local);
```

### 1.2 Choosing a Calculation Method

```ts
import { calculatePrayerTimes, BUILT_IN_METHODS } from 'tauqeet-js';

// Show all available built-in methods
console.log(Object.keys(BUILT_IN_METHODS));
// ['MWL', 'ISNA', 'Egypt', 'Makkah', 'UmmAlQura', 'Karachi', 'Tehran', 'Jafari']

// Karachi, Pakistan — University of Islamic Sciences method
const times = calculatePrayerTimes({
  lat: 24.8607,
  long: 67.0011,
  date: new Date('2024-04-27'),
  timeZone: 'Asia/Karachi',
  method: 'Karachi',
});
```

### 1.3 Custom Method

```ts
import { calculatePrayerTimes } from 'tauqeet-js';

const times = calculatePrayerTimes({
  lat: 33.6844,
  long: 73.0479,
  timeZone: 'Asia/Karachi',
  method: {
    id: 'CUSTOM',
    name: 'My Custom Method',
    fajrAngle: 17,
    ishaAngle: 15,
    source: 'custom',
  },
});
```

### 1.4 Hanafi Asr

```ts
import { calculatePrayerTimes, Madhab } from 'tauqeet-js';

const times = calculatePrayerTimes({
  lat: 24.8607,
  long: 67.0011,
  timeZone: 'Asia/Karachi',
  method: 'Karachi',
  madhab: Madhab.HANAFI, // or simply 'Hanafi'
});

console.log('Asr (Hanafi):', times.asr.local);
```

### 1.5 Formatting Output

```ts
import { calculatePrayerTimes, formatPrayerTimes } from 'tauqeet-js';

const result = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  timeZone: 'Europe/London',
});

// 12-hour format
const fmt12 = formatPrayerTimes(result, '12h', 'Europe/London');
if (fmt12.success) {
  console.log(fmt12.data.fajr);    // "04:00:45 AM"
  console.log(fmt12.data.isha);    // "10:52:03 PM"
}

// ISO 8601 UTC strings
const fmtISO = formatPrayerTimes(result, 'iso8601');
if (fmtISO.success) {
  console.log(fmtISO.data.fajr);   // "2024-04-09T03:00:45Z"
}

// Unix timestamps (ms)
const fmtUnix = formatPrayerTimes(result, 'unix');
if (fmtUnix.success) {
  console.log(fmtUnix.data.fajr);  // 1712628045000
}
```

### 1.6 Adding Minute Adjustments

Some local authorities apply fixed offsets to match printed timetables:

```ts
const times = calculatePrayerTimes({
  lat: 24.8607,
  long: 67.0011,
  timeZone: 'Asia/Karachi',
  method: 'Karachi',
  adjustments: {
    fajr:    2,    // +2 minutes
    dhuhr:  -1,    // −1 minute
    maghrib: 3,    // +3 minutes
  },
});
```

### 1.7 Async Timezone Resolution

Use this pattern in server-side applications where you resolve the timezone automatically from coordinates (e.g., via a geolocation API):

```ts
import { calculatePrayerTimesAsync } from 'tauqeet-js';

async function fetchTimezone(lat: number, lon: number): Promise<string> {
  const res = await fetch(`https://timezonefinder.example.com?lat=${lat}&lon=${lon}`);
  const data = await res.json();
  return data.timezone; // e.g. "Asia/Karachi"
}

const result = await calculatePrayerTimesAsync({
  lat: 24.8607,
  long: 67.0011,
  resolveTimezoneAsync: fetchTimezone,
});

console.log(result.fajr.local);
```

### 1.8 Metadata / Debug Mode

```ts
const times = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  withMetadata: true,
});

if (times.metadata?.fajr) {
  console.log('Fajr Declination :', times.metadata.fajr.DEC);
  console.log('Equation of Time :', times.metadata.fajr.EOT, 'minutes');
  console.log('Twilight Angle   :', times.metadata.fajr.angle, '°');
  console.log('Iterations       :', times.metadata.fajr.iterations);
}
```

### 1.9 High-Latitude Locations

At high latitudes (> ~48°), twilight can last all night during summer, making Fajr and Isha undefined. Use a `highLatitudeStrategy` to handle these edge cases:

```ts
import { calculatePrayerTimes } from 'tauqeet-js';

// Oslo, Norway — Midsummer
const times = calculatePrayerTimes({
  lat: 59.9139,
  long: 10.7522,
  date: new Date('2024-06-21'),
  timeZone: 'Europe/Oslo',
  method: 'MWL',
  highLatitudeStrategy: 'AngleBased',
});

console.log('Fajr status:', times.fajr.status);
// Could be 'SUCCESS', 'CONTINUOUS_TWILIGHT', 'POLAR_DAY', or 'REGIONAL_FALLBACK'

if (times.fajr.status === 'SUCCESS') {
  console.log('Fajr:', times.fajr.local);
}
```

**Strategy comparison:**

| Strategy | Description | Recommended for |
|---|---|---|
| `AngleBased` | Proportional fraction of the night using the twilight angle | Most locations above 48° |
| `MiddleOfNight` | Midpoint of astronomical night | Conservative fallback |
| `SeventhOfNight` | 1/7 of night duration | Some European fatwa councils |
| `NearestLatitude` | Copy calculations from a fallback latitude (default 45°) | When local rules require a reference city |

**Checking for polar day:**

```ts
// Tromsø, Norway — June Solstice
const result = calculatePrayerTimes({
  lat: 69.6492,
  long: 18.9553,
  date: new Date('2024-06-21'),
  timeZone: 'Europe/Oslo',
  method: 'MWL',
});

// Without a strategy, polar day events return null times
if (result.sunrise.status === 'POLAR_DAY') {
  console.log('The sun does not set today — polar day condition.');
}
```

---

## 2. Qibla Direction

> 📖 **API Reference:** [docs/qibla-and-solar-alignment.md](docs/qibla-and-solar-alignment.md)

### 2.1 Basic Bearing & Distance

```ts
import { getQiblaDirection } from 'tauqeet-js';

// From New York City
const qibla = getQiblaDirection({ latitude: 40.7128, longitude: -74.0060 });

if (qibla.bearing !== null) {
  console.log(`Qibla bearing: ${qibla.bearing.toFixed(1)}°`);
  console.log(`Distance to Kaaba: ${qibla.distanceKm.toFixed(0)} km`);
}
// Expected: bearing ≈ 58.5°, distance ≈ 9,133 km
```

> **Edge case:** If the observer is within 1 m of the Kaaba, `bearing` is `null`.

### 2.2 Rhumb-Line Bearing

The great-circle bearing is the shortest path on the globe. The rhumb-line bearing follows a constant compass heading — easier to follow on a traditional compass but slightly longer.

```ts
import { getQiblaAdvanced } from 'tauqeet-js';

const result = getQiblaAdvanced({ latitude: 51.5074, longitude: -0.1278 });

console.log(`Great-circle bearing: ${result.bearing?.toFixed(1)}°`);
console.log(`Rhumb-line bearing  : ${result.rhumbBearing?.toFixed(1)}°`);
console.log(`Distance            : ${result.distanceKm.toFixed(0)} km`);
```

### 2.3 Sun-at-Qibla Times

Find when the sun faces the Kaaba — useful for verifying compass calibration or Qibla direction by shadow:

```ts
import { getSunAtQibla } from 'tauqeet-js';

const alignment = getSunAtQibla({
  latitude:  51.5074,
  longitude: -0.1278,
  date:      new Date('2024-04-09'),
  timeZone:  'Europe/London',
});

if (alignment.qiblaAlignment) {
  console.log('Sun faces Kaaba at:', alignment.qiblaAlignment.local);
}
if (alignment.antiQiblaAlignment) {
  console.log('Shadow faces Kaaba at:', alignment.antiQiblaAlignment.local);
}
```

---

## 3. Moon Module

> 📖 **API Reference:** [docs/moon.md](docs/moon.md)

### 3.1 Moon Phase & Illumination

```ts
import { getMoonPhase } from 'tauqeet-js';

const phase = getMoonPhase(new Date('2024-04-09T12:00:00Z'));

console.log('Phase name  :', phase.phaseName);            // e.g. "Waxing Gibbous"
console.log('Elongation  :', phase.elongation.toFixed(1), '°');
console.log('Illumination:', (phase.illuminatedFraction * 100).toFixed(1) + '%');
```

**Phase names and elongation ranges:**

| Phase name | Elongation |
|---|---|
| New | ~0° |
| Waxing Crescent | 0°–90° |
| First Quarter | ~90° |
| Waxing Gibbous | 90°–180° |
| Full | ~180° |
| Waning Gibbous | 180°–270° |
| Last Quarter | ~270° |
| Waning Crescent | 270°–360° |

### 3.2 Moon Age

```ts
import { getMoonAge } from 'tauqeet-js';

const age = getMoonAge(new Date());

console.log(`Moon age: ${age.ageDays.toFixed(1)} days`);
console.log(`Last new moon: ${age.previousNewMoon.toISOString()}`);
```

### 3.3 Lunar Events

```ts
import {
  getNextNewMoon,
  getPreviousNewMoon,
  getNextFullMoon,
  getPreviousFullMoon,
} from 'tauqeet-js';

const today = new Date();

console.log('Next new moon    :', getNextNewMoon(today).toISOString());
console.log('Previous new moon:', getPreviousNewMoon(today).toISOString());
console.log('Next full moon   :', getNextFullMoon(today).toISOString());
console.log('Previous full moon:', getPreviousFullMoon(today).toISOString());
```

### 3.4 Crescent Visibility (Single Method)

Predict whether the crescent moon will be visible from a specific location on the first evening of a new lunar month:

```ts
import { checkVisibility, VisibilityMethod } from 'tauqeet-js';

// Karachi, Pakistan — evening of 30 March 2025
const result = checkVisibility({
  date:      new Date('2025-03-30'),
  latitude:  24.8607,
  longitude: 67.0011,
  method:    VisibilityMethod.ODEH,
});

console.log('Criterion :', result.criterionName);        // "Odeh"
console.log('Visible   :', result.visible);
console.log('Confidence:', result.confidence);
console.log('Details   :', result.details);
```

**Odeh criterion rules:**
- Moon altitude at sunset ≥ 5°
- Elongation ≥ 8°
- Moon age ≥ 15 hours

### 3.5 Crescent Visibility (All Methods)

```ts
import { checkMultipleCriteria } from 'tauqeet-js';

const results = checkMultipleCriteria({
  date:      new Date('2025-03-30'),
  latitude:  24.8607,
  longitude: 67.0011,
});

for (const r of results) {
  console.log(`[${r.criterionName}] visible=${r.visible} category=${r.category ?? '—'}`);
}
// [Odeh]   visible=true  category=—
// [Yallop] visible=true  category=A
// [HMNAO]  visible=false category=—
```

**Yallop categories:**

| Category | Meaning |
|---|---|
| A | Easily visible to the naked eye |
| B | Visible under perfect conditions |
| C | May need optical aid |
| D | Need optical aid to find, then naked eye |
| E | Not visible |
| F | Not visible (below threshold) |

> **Edge case (polar regions):** If the sun does not set at the given location on the given date, `checkVisibility` returns `visible: false` with `details.error` set, and `checkMultipleCriteria` returns an empty array `[]`.

---

## 4. Hijri Calendar

> 📖 **API Reference:** [docs/hijri.md](docs/hijri.md)

### 4.1 Gregorian → Hijri (Civil)

The fastest method — pure arithmetic, no network or astronomy required. Suitable for most display purposes.

```ts
import { toHijri, HijriMethod, HIJRI_MONTH_NAMES } from 'tauqeet-js';

const hijri = toHijri(new Date('2024-04-09'), HijriMethod.CIVIL);

console.log(`${hijri.day} ${HIJRI_MONTH_NAMES[hijri.month - 1]} ${hijri.year} AH`);
// "29 Ramadan 1445 AH"
```

### 4.2 Gregorian → Hijri (Conjunction)

Month starts on the calendar day (UTC) of the astronomical new moon. More accurate than the Civil method for predicting real-world crescent months.

```ts
import { toHijri, HijriMethod } from 'tauqeet-js';

const hijri = toHijri(new Date('2024-04-09'), HijriMethod.CONJUNCTION);
console.log(`${hijri.day}/${hijri.month}/${hijri.year} AH`);
```

### 4.3 Gregorian → Hijri (Visibility)

Month starts on the first evening the crescent is visible from a specified location. This is the most locale-sensitive method and requires coordinates.

```ts
import { toHijri, HijriMethod } from 'tauqeet-js';

const hijri = toHijri(
  new Date('2024-04-09'),
  HijriMethod.VISIBILITY,
  {
    location: {
      latitude:  21.4225,   // Mecca
      longitude: 39.8262,
    },
  }
);

console.log(`${hijri.day}/${hijri.month}/${hijri.year} AH`);
```

### 4.4 Gregorian → Hijri (Umm al-Qura)

The official Saudi calendar. It uses exact tabulated data (1343 AH – 1500 AH) to guarantee 100% civil accuracy with official records, gracefully falling back to a conjunction-based approximation for out-of-bounds dates. No location needed.

```ts
import { toHijri, HijriMethod } from 'tauqeet-js';

const hijri = toHijri(new Date('2024-04-09'), HijriMethod.UMM_AL_QURA);
console.log(`${hijri.day}/${hijri.month}/${hijri.year} AH`);
```

### 4.5 Hijri → Gregorian

```ts
import { toGregorian, HijriMethod } from 'tauqeet-js';

// 1st Ramadan 1446 AH → Gregorian
const gregorian = toGregorian({ year: 1446, month: 9, day: 1 }, HijriMethod.CIVIL);
console.log(gregorian.toISOString().slice(0, 10));  // "2025-03-01"
```

### 4.6 Calendar Month Grid

Build a full weekly grid for a Hijri month (useful for calendar UI components):

```ts
import { HijriEngine, HijriMethod, HIJRI_MONTH_NAMES } from 'tauqeet-js';

const engine = new HijriEngine(HijriMethod.CIVIL);
const grid   = engine.getMonthGrid(1446, 9); // Ramadan 1446

const header = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
console.log(`\n=== ${HIJRI_MONTH_NAMES[8]} 1446 ===`);
console.log(header.join('\t'));

for (const week of grid) {
  const row = week.map(d => (d ? String(d.day).padStart(2) : '  ')).join('\t');
  console.log(row);
}
```

---

## 5. Error Handling

### Throw-style API (`calculatePrayerTimes`)

```ts
import { calculatePrayerTimes } from 'tauqeet-js';

try {
  const times = calculatePrayerTimes({
    lat: 999,   // Invalid — will throw
    long: 0,
  });
} catch (err) {
  console.error('Error:', (err as Error).message);
}
```

### Result-style API (`getPrayerTimes`)

```ts
import { getPrayerTimes } from 'tauqeet-js';

const result = getPrayerTimes({ lat: 999, long: 0 });

if (!result.success) {
  console.error('Validation failed:', result.error);
} else {
  console.log(result.data.fajr.local);
}
```

### Handling `null` Times

Even on a successful calculation, individual prayer times may be `null` in polar regions:

```ts
import { calculatePrayerTimes } from 'tauqeet-js';

const times = calculatePrayerTimes({
  lat: 71.0,   // Far north
  long: 25.0,
  date: new Date('2024-06-21'),
  method: 'MWL',
  highLatitudeStrategy: 'AngleBased',
});

for (const [name, field] of Object.entries(times)) {
  if (name === 'metadata') continue;
  const tf = field as import('tauqeet-js').TimeField;
  if (tf.local === null) {
    console.warn(`${name}: unavailable (${tf.status})`);
  } else {
    console.log(`${name}: ${tf.local}`);
  }
}
```
