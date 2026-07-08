# tauqeet-js — Complete API Reference

> Auto-generated reference for all public modules. Every function signature,
> parameter type, and return shape is documented here so contributors can
> integrate the library without reading source code.

---

## Table of Contents
1. [Astronomy Module](#1-astronomy-module)
   - [computeSolarPosition](#computesolarposition)
   - [computeLunarPosition](#computelunarposition)
   - [computeLunarPhase](#computelunarphase)
   - [dateToJulianDay / julianDayToDate](#julian-day-utilities)
   - [calculateDeltaT](#calculatedeltatt)
   - [Eclipse functions](#eclipse-functions)
   - [Visibility / Horizon](#visibility--horizon)
   - [Seasons](#seasons)
2. [Moon Module](#2-moon-module)
   - [getMoonPhase](#getmoonphase)
   - [getMoonIllumination](#getmoonillumination)
   - [getMoonVisibility (Odeh / Yallop / HMNAO)](#getmoonvisibility)
3. [Prayers Module](#3-prayers-module)
   - [calculatePrayerTimes](#calculateprayertimes)
   - [calculatePrayerTimesAsync](#calculateprayertimesasync)
   - [getPrayerTimes / getPrayerTimesAsync](#getprayertimes--getprayertimesasync)
4. [Shared Data Shapes](#4-shared-data-shapes)

---

## 1. Astronomy Module

**Import path:**
```ts
import { ... } from 'tauqeet-js/astronomy';
// or from local dist:
import { ... } from '../tauqeet-js/dist/astronomy/index.js';
```

---

### `computeSolarPosition`

Computes the apparent geocentric solar position for a given instant.

**Underlying theories:**
- VSOP87 (heliocentric Earth position)
- IAU 1980 nutation + aberration
- FK5 reduction for Fk5 frame
- Apparent coordinates include nutation in longitude, aberration

```ts
function computeSolarPosition(
  j:      number,   // Julian Day (integer part of JD at 0h UT)
  ut:     number,   // Universal Time in decimal hours (0–24)
  deltaT: number    // ΔT in seconds (TT − UT1)
): SolarPositionResult
```

| Parameter | Type | Example | Notes |
|-----------|------|---------|-------|
| `j` | `number` | `2451545.0` | Julian Day number (noon UT = .5 fractional day) |
| `ut` | `number` | `12.0` | UT in hours (0–24), e.g. 18.5 = 18:30 UT |
| `deltaT` | `number` | `69.18` | seconds; use `calculateDeltaT(year)` |

**Returns: `SolarPositionResult`**

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `rightAscension` | `number` | degrees (0–360) | Apparent RA, ecliptic-of-date, nutation applied |
| `declination` | `number` | degrees (−90–+90) | Apparent Dec |
| `gha` | `number` | degrees (0–360) | Greenwich Hour Angle = GAST − RA |
| `sha` | `number` | degrees (0–360) | Sidereal Hour Angle = 360° − RA |
| `apparentLongitude` | `number` | degrees (0–360) | Ecliptic apparent longitude (nutation+aberration applied) |
| `apparentLatitude` | `number` | degrees (~0) | Ecliptic apparent latitude (≈ 0° for Sun) |
| `distanceAu` | `number` | AU | Geocentric distance |
| `semidiameter` | `number` | arcminutes | Angular radius from `959.63/r/60` |
| `horizontalParallax` | `number` | arcminutes | Solar HP from `8.794/r/60` |
| `equationOfTime` | `number` | minutes of time | EoT = 4·(GHA + 180° − 15·UT) |
| `gmst` | `number` | degrees (0–360) | Greenwich Mean Sidereal Time |
| `gast` | `number` | degrees (0–360) | Greenwich Apparent Sidereal Time |

> ⚠️ **Known bug:** The `equationOfTime` field currently returns incorrect values (≈ −720 min).
> See [improvements.md](./improvements.md) for root cause and fix.

---

### `computeLunarPosition`

Computes the apparent geocentric lunar position.

**Underlying theories:**
- ELP2000-82b (lunar series, ~40,000 terms)
- IAU 1980 nutation
- Precession via polynomial (5029.0966·T + 1.11161·T² − 0.000113·T³ arcsec/century)

```ts
function computeLunarPosition(
  j:      number,   // Julian Day
  ut:     number,   // UT in decimal hours
  deltaT: number    // ΔT in seconds
): LunarPositionResult
```

**Returns: `LunarPositionResult`**

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `rightAscension` | `number` | degrees (0–360) | Apparent RA (ecliptic-of-date + nutation) |
| `declination` | `number` | degrees (−90–+90) | Apparent Dec |
| `gha` | `number` | degrees (0–360) | Greenwich Hour Angle |
| `sha` | `number` | degrees (0–360) | Sidereal Hour Angle |
| `apparentLongitude` | `number` | degrees (0–360) | Ecliptic longitude + ΔΨ |
| `distanceKm` | `number` | km | Geocentric distance |
| `semidiameter` | `number` | **arcseconds** | Angular radius: `asin(1738/dist)*3600` |
| `horizontalParallax` | `number` | **arcseconds** | Equatorial HP: `asin(6378.14/dist)*3600` |
| `illuminationFraction` | `number` | 0–1 | Fraction of illuminated disk |

> ⚠️ **Unit note:** `semidiameter` and `horizontalParallax` are in **arcseconds**,
> unlike the Sun where they are in **arcminutes**. Convert: `arcmin = arcsec / 60`.

---

### `computeLunarPhase`

Returns the elongation (Moon−Sun ecliptic longitude difference) and illumination.

```ts
function computeLunarPhase(
  j:      number,
  ut:     number,
  deltaT: number
): { elongation: number }
```

| Return field | Type | Unit | Notes |
|---|---|---|---|
| `elongation` | `number` | degrees (0–360) | 0 = New, 90 = First Quarter, 180 = Full, 270 = Last Quarter |

---

### Julian Day Utilities

```ts
// Convert calendar date to Julian Day Number
function dateToJulianDay(year: number, month: number, day: number): number
//  day can include fractional part: day = 8.75 means 8th at 18:00 UT

// Convert Julian Day to calendar components
function julianDayToDate(jd: number): { year: number; month: number; day: number }
//  day has fractional part; extract UT: (day % 1) * 24
```

**Example:**
```ts
const jd = dateToJulianDay(2024, 4, 8.75);  // 2024-04-08 18:00 UT → 2460409.25
const { year, month, day } = julianDayToDate(2460409.25);
// year=2024, month=4, day=8.75 → UT = (0.75)*24 = 18:00
```

---

### `calculateDeltaT`

Polynomial approximation of ΔT = TT − UT1 in seconds.

**Source:** Espenak & Meeus (2006) polynomial series, *Five Millennium Canon of Solar Eclipses*.
Accuracy: ±0.5 s (1950–2050), ±2 s (1800–1950), degrades outside.

```ts
function calculateDeltaT(year: number): number
//  year: decimal year, e.g. 2024.25 = end of March 2024
//  returns: ΔT in seconds
```

| Year range | Accuracy | Formula order |
|---|---|---|
| 1950–2050 | ±0.5 s | Polynomial degree 2–5 |
| 1800–1950 | ±2 s | Polynomial degree 3–6 |
| < 500 or > 2150 | Low | Parabolic `−20 + 32u²` |

---

### Eclipse Functions

All eclipse functions auto-derive ΔT internally from the Julian Day's year.

```ts
// Global solar eclipse: search forward from startTimeJd
function searchGlobalSolarEclipse(startTimeJd: number): GlobalSolarEclipseInfo
function nextGlobalSolarEclipse(prevEclipseJd: number): GlobalSolarEclipseInfo

// Lunar eclipse
function searchLunarEclipse(startTimeJd: number): LunarEclipseInfo
function nextLunarEclipse(prevEclipseJd: number): LunarEclipseInfo

// Local solar eclipse (observer-specific)
function searchLocalSolarEclipse(
  startTimeJd: number,
  observer: GeographicPosition
): LocalSolarEclipseInfo
function nextLocalSolarEclipse(
  prevEclipseJd: number,
  observer: GeographicPosition
): LocalSolarEclipseInfo
```

**`GeographicPosition`:**
```ts
interface GeographicPosition {
  latitude:   number;  // degrees, −90..+90
  longitude:  number;  // degrees, −180..+180 (east positive)
  altitude?:  number;  // meters ASL (default 0)
}
```

**`GlobalSolarEclipseInfo`:**

| Field | Type | Notes |
|-------|------|-------|
| `kind` | `EclipseKind` | `Penumbral=0`, `Partial=1`, `Total=2`, `Annular=3` |
| `peak` | `EventTime` | UTC peak time |
| `obscuration` | `number?` | 0–1 (undefined for Partial on path boundary) |
| `latitude` | `number?` | Latitude of greatest eclipse (° N) |
| `longitude` | `number?` | Longitude of greatest eclipse (° E) |
| `distance` | `number` | Shadow axis distance to Earth center (km) |

**`LunarEclipseInfo`:**

| Field | Type | Notes |
|-------|------|-------|
| `kind` | `EclipseKind` | `Penumbral`, `Partial`, or `Total` |
| `peak` | `EventTime` | UTC peak (mid-eclipse) |
| `obscuration` | `number` | 0–1 |
| `sdPenumbral` | `number` | Semi-duration of penumbral phase (minutes) |
| `sdPartial` | `number` | Semi-duration of partial phase (minutes) |
| `sdTotal` | `number` | Semi-duration of total phase (minutes) |

**`LocalSolarEclipseInfo`:**

| Field | Type | Notes |
|-------|------|-------|
| `kind` | `EclipseKind` | Type visible from observer |
| `obscuration` | `number` | 0–1 at peak |
| `peak` | `EclipseEvent` | `{ time: EventTime, altitude: number }` |
| `partialBegin` | `EclipseEvent` | C1 contact |
| `totalBegin` | `EclipseEvent?` | C2 contact (if total/annular) |
| `totalEnd` | `EclipseEvent?` | C3 contact (if total/annular) |
| `partialEnd` | `EclipseEvent` | C4 contact |

**`EventTime`:**
```ts
interface EventTime {
  julianDay: number;  // JD at event
  ut:        number;  // UT decimal hours
  year:      number;
  month:     number;
  day:       number;  // integer day
  hour:      number;
  minute:    number;
  second:    number;
}
```

---

### New/Full Moon Search

```ts
function computeNextNewMoon(jd: number, ut: number, deltaT: number): EventTime
function computeNextFullMoon(jd: number, ut: number, deltaT: number): EventTime
function computePreviousNewMoon(jd: number, ut: number, deltaT: number): EventTime
function computePreviousFullMoon(jd: number, ut: number, deltaT: number): EventTime
```

---

### Visibility / Horizon

```ts
function computeHorizontalPosition(
  gha:       number,   // degrees
  dec:       number,   // degrees
  observer:  GeographicPosition
): { altitude: number; azimuth: number }
// altitude: degrees above horizon (negative = below)
// azimuth:  degrees clockwise from North (0–360)
```

---

### Seasons

```ts
function computeSeasons(year: number): SeasonInfo

interface SeasonInfo {
  marchEquinox:      EventTime;  // Sun λ = 0°
  juneSolstice:      EventTime;  // Sun λ = 90°
  septemberEquinox:  EventTime;  // Sun λ = 180°
  decemberSolstice:  EventTime;  // Sun λ = 270°
}
```

---

## 2. Moon Module

**Import path:**
```ts
import { ... } from 'tauqeet-js/moon';
// or: import { ... } from '../tauqeet-js/dist/moon/index.js';
```

---

### `getMoonPhase`

Returns current phase information for a JS `Date`.

```ts
function getMoonPhase(date: Date): MoonPhaseResult

interface MoonPhaseResult {
  phase?:              number;  // 0..1 (0=New, 0.5=Full) — legacy
  elongation:          number;  // degrees (0–360)
  illuminatedFraction: number;  // 0..1
  phaseAngle?:         number;  // degrees
  phaseName?:          string;  // "New", "Waxing Crescent", etc.
}
```

---

### `getMoonIllumination`

Returns illuminated fraction as a plain number (0–1).

```ts
function getMoonIllumination(date: Date): number
// 0.0 = New Moon   |   1.0 = Full Moon
```

---

### `getMoonVisibility`

Checks crescent visibility using an empirical criterion.

```ts
function getMoonVisibility(
  input:  VisibilityInput,
  method: VisibilityMethod   // ODEH | YALLOP | HMNAO
): VisibilityResult

interface VisibilityInput {
  sunset:              Date;
  moonset?:            Date;
  moonAltitudeAtSunset: number;  // degrees
  moonAzimuthAtSunset:  number;  // degrees
  elongation:           number;  // degrees (Sun−Moon)
  moonAgeHours:         number;  // hours since New Moon
  arcv?:                number;  // altitude difference
  arcl?:                number;  // elongation difference
}

interface VisibilityResult {
  criterionName: string;
  visible:       boolean;
  confidence?:   number;   // 0..1
  category?:     string;   // 'A', 'B', 'C' (Yallop)
  details?:      Record<string, unknown>;
}

enum VisibilityMethod { ODEH = 'odeh', YALLOP = 'yallop', HMNAO = 'hmnao' }
```

---

## 3. Prayers Module

**Import path:**
```ts
import { calculatePrayerTimes, ... } from 'tauqeet-js/prayers';
// or: import { ... } from '../tauqeet-js/dist/prayers/index.js';
```

---

### `calculatePrayerTimes`

Synchronous prayer time calculation. Throws on invalid config.

```ts
function calculatePrayerTimes(config: PrayerConfig): PrayerTimesResult
```

**`PrayerConfig`:**

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `lat` | `number \| string \| DMSTuple` | required | Latitude |
| `long` | `number \| string \| DMSTuple` | required | Longitude |
| `date` | `Date \| number \| string` | today | Target date |
| `timeZone` | `string \| number` | required | IANA name or UTC offset hours |
| `method` | `string \| PrayerMethodConfig` | `'ISNA'` | Calculation method |
| `madhab` | `'Hanafi' \| 'Shafi' \| ...` | `'Shafi'` | Asr shadow ratio |
| `elevation` | `number \| ElevationInput` | `0` | ASL in meters or feet |
| `temperatureC` | `number` | `10` | For atmospheric refraction |
| `pressureMbar` | `number` | `1010` | For atmospheric refraction |
| `adjustments` | `Partial<Record<PrayerName, number>>` | — | Manual ±minutes per prayer |
| `highLatitudeStrategy` | `string` | `undefined` | Strategy for polar regions |
| `withMetadata` | `boolean` | `false` | Include ephemeris data in result |
| `resolveTimezoneAsync` | `fn` | — | Async tz resolver (for async API) |

**`PrayerTimesResult`:**

```ts
interface PrayerTimesResult {
  fajr:        TimeField;
  sunrise:     TimeField;
  dhahwaKubra: TimeField;  // Duha / Ishraq
  dhuhr:       TimeField;
  asr:         TimeField;
  maghrib:     TimeField;
  isha:        TimeField;
  metadata?:   PrayerMetadata;  // only when withMetadata: true
}

interface TimeField {
  utc:       string | null;  // ISO-8601 e.g. "2026-05-24T04:12:00Z"
  local:     string | null;  // Display string e.g. "04:12 AM"
  timestamp: number | null;  // Unix epoch (ms)
  status:    PrayerStatus;
}

type PrayerStatus =
  | 'SUCCESS'
  | 'CONTINUOUS_TWILIGHT'
  | 'ASTRONOMICAL_MIDNIGHT'
  | 'POLAR_NIGHT'
  | 'POLAR_DAY'
  | 'REGIONAL_FALLBACK';
```

**`PrayerMetadata`** (when `withMetadata: true`):

| Prayer | Available fields |
|--------|-----------------|
| `fajr` | `DEC`, `EOT`, `angle`, `iterations` |
| `sunrise` | `DEC`, `EOT`, `HP`, `SD`, `iterations` |
| `dhuhr` | `DEC`, `EOT`, `SD`, `iterations` |
| `asr` | `DEC`, `EOT`, `HP`, `SD`, `asrAngle`, `iterations` |
| `maghrib` | `DEC`, `EOT`, `HP`, `SD`, `iterations` |
| `isha` | `DEC`, `EOT`, `angle?`, `iterations` |

All metadata angles are in degrees; DEC and EOT in degrees and minutes respectively.

---

### `calculatePrayerTimesAsync`

Async version that supports `resolveTimezoneAsync` for automatic timezone detection.

```ts
async function calculatePrayerTimesAsync(config: PrayerConfig): Promise<PrayerTimesResult>
```

---

### `getPrayerTimes` / `getPrayerTimesAsync`

Legacy-compatible wrappers that return a `Result<T>` instead of throwing.

```ts
function getPrayerTimes(config: PrayerConfig): Result<PrayerTimesResult>
async function getPrayerTimesAsync(config: PrayerConfig): Promise<Result<PrayerTimesResult>>

type Result<T> =
  | { success: true;  data:  T      }
  | { success: false; error: string }
```

---

## 4. Shared Data Shapes

### `DMSTuple` — Degrees/Minutes/Seconds coordinate input

```ts
interface DMSTuple {
  degrees:   number;
  minutes:   number;
  seconds:   number;
  direction: 'N' | 'S' | 'E' | 'W';
}
// Example: { degrees: 21, minutes: 25, seconds: 21, direction: 'N' }
```

### `ElevationInput` — Elevation with unit

```ts
interface ElevationInput {
  value: number;
  unit:  'meters' | 'feet';
}
```

### `EclipseKind` enum

| Value | Number | Meaning |
|-------|--------|---------|
| `Penumbral` | `0` | Only penumbral shadow (lunar) |
| `Partial` | `1` | Partial umbra |
| `Total` | `2` | Full umbra coverage |
| `Annular` | `3` | Ring of fire (solar only) |

---

## Unit Cheat Sheet

| Quantity | tauqeet-js unit | Typical astronomy unit |
|----------|----------------|----------------------|
| RA | degrees (0–360°) | hours (0–24h) — multiply by 15 |
| Dec | degrees (−90–+90°) | same |
| GHA | degrees (0–360°) | same |
| Moon SD | **arcseconds** | arcminutes — divide by 60 |
| Moon HP | **arcseconds** | arcminutes — divide by 60 |
| Sun SD | arcminutes | same |
| Sun HP | arcminutes | same |
| EoT | minutes of time | same |
| ΔT | seconds | same |
| Distance (sun) | AU | 1 AU = 149,597,870.7 km |
| Distance (moon) | km | same |
