# API Reference

> **Latest interactive version:** [https://tauqeet-js.web.app](https://tauqeet-js.web.app)

This document covers every public symbol exported by `tauqeet-js`. Symbols are grouped by module.

---

## Table of Contents

1. [Common Types](#1-common-types)
2. [Prayers Module](#2-prayers-module)
   - [Functions](#21-functions)
   - [Types](#22-types)
   - [Enums & Constants](#23-enums--constants)
3. [Qibla Module](#3-qibla-module)
   - [Functions](#31-functions)
   - [Types](#32-types)
4. [Solar Alignment Module](#4-solar-alignment-module)
   - [Functions](#41-functions)
   - [Types](#42-types)
5. [Moon Module](#5-moon-module)
   - [Phase & Age Functions](#51-phase--age-functions)
   - [Lunar Event Functions](#52-lunar-event-functions)
   - [Visibility Functions](#53-visibility-functions)
   - [Types & Enums](#54-types--enums)
6. [Hijri Module](#6-hijri-module)
   - [Convenience Functions](#61-convenience-functions)
   - [HijriEngine Class](#62-hijriengine-class)
   - [Calendar Classes](#63-calendar-classes)
   - [Types & Enums](#64-types--enums)
   - [Core Helpers](#65-core-helpers)

---

## 1. Common Types

### `Result<T>`

A discriminated union used by legacy-compatible functions to avoid throwing exceptions.

```ts
type Result<T> =
  | { readonly success: true;  readonly data: T      }
  | { readonly success: false; readonly error: string };
```

**Usage pattern:**
```ts
const result = getPrayerTimes(config);
if (result.success) {
  console.log(result.data.fajr);
} else {
  console.error(result.error);
}
```

### Helper Constructors

| Function | Signature | Description |
|---|---|---|
| `Success<T>` | `(data: T) => Result<T>` | Wraps a value in a successful Result |
| `Failure` | `(error: string) => Result<never>` | Wraps an error string in a failed Result |

---

## 2. Prayers Module

**Import path:** `tauqeet-js` or `tauqeet-js/prayers`

### 2.1 Functions

#### `calculatePrayerTimes(config)`

Synchronous prayer time calculation. **Throws** a `PrayerCalculationError` on invalid input.

```ts
function calculatePrayerTimes(config: PrayerConfig): PrayerTimesResult
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `config` | `PrayerConfig` | ✅ | Full configuration object (see [PrayerConfig](#prayerconfig)) |

**Returns:** [`PrayerTimesResult`](#prayertimesresult)

---

#### `calculatePrayerTimesAsync(config)`

Asynchronous variant that supports async timezone resolution via the `resolveTimezoneAsync` hook.

```ts
async function calculatePrayerTimesAsync(config: PrayerConfig): Promise<PrayerTimesResult>
```

---

#### `getPrayerTimes(config)`

Legacy-compatible synchronous API. Returns a `Result` wrapper instead of throwing.

```ts
function getPrayerTimes(config: PrayerConfig): Result<PrayerTimesResult>
```

---

#### `getPrayerTimesAsync(config)`

Legacy-compatible asynchronous API. Returns a `Result` wrapper instead of throwing.

```ts
async function getPrayerTimesAsync(config: PrayerConfig): Promise<Result<PrayerTimesResult>>
```

---

#### `formatPrayerTimes(times, type, timeZone?)`

Converts raw `PrayerTimesResult` fields into a human-friendly format.

```ts
function formatPrayerTimes<T extends 'iso8601' | 'unix' | '12h' | '24h'>(
  times: Omit<PrayerTimesResult, 'metadata'>,
  type: T,
  timeZone?: string
): Result<FormattedTimes<T>>
```

| Parameter | Type | Description |
|---|---|---|
| `times` | `PrayerTimesResult` | The result from a prayer calculation |
| `type` | `'iso8601' \| 'unix' \| '12h' \| '24h'` | Output format |
| `timeZone` | `string` (optional) | IANA timezone identifier (e.g. `'Asia/Karachi'`) |

**Format options:**

| Value | Output type | Example |
|---|---|---|
| `'iso8601'` | `string` | `"2024-04-09T01:41:00Z"` |
| `'unix'` | `number` | `1712622060000` |
| `'12h'` | `string` | `"04:41:00 AM"` |
| `'24h'` | `string` | `"04:41:00"` |

---

#### `resolveTimeZoneSync(latitude, longitude)`

Attempts to resolve the IANA timezone identifier for given coordinates using the system's `Intl` API.

```ts
function resolveTimeZoneSync(latitude: number, longitude: number): string | undefined
```

---

### 2.2 Types

#### `PrayerConfig`

The central configuration object passed to all prayer-time functions.

```ts
interface PrayerConfig {
  readonly lat:  CoordinateInput;   // Observer latitude
  readonly long: CoordinateInput;   // Observer longitude
  readonly timeZone?:  string | number;
  readonly date?: Date | number | string;
  readonly method?: string | PrayerMethodConfig;
  readonly madhab?: 'Hanafi' | 'Shafi';
  readonly elevation?: number | ElevationInput;
  readonly temperatureC?: number;
  readonly pressureMbar?: number;
  readonly resolveTimezoneAsync?: (lat: number, lon: number) => Promise<string> | string;
  readonly adjustments?: Partial<Record<PrayerName, number>>;
  readonly withMetadata?: boolean;
  readonly highLatitudeStrategy?: 'AngleBased' | 'MiddleOfNight' | 'SeventhOfNight' | 'NearestLatitude';
  readonly regionalFallbackLatitude?: number;
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `lat` | `CoordinateInput` | — | Latitude: decimal degrees, DMS string, or `DMSTuple` |
| `long` | `CoordinateInput` | — | Longitude: decimal degrees, DMS string, or `DMSTuple` |
| `timeZone` | `string \| number` | UTC | IANA name (`'America/New_York'`) or numeric offset (`5`) |
| `date` | `Date \| number \| string` | Today | Date for which to compute times |
| `method` | `string \| PrayerMethodConfig` | `'MWL'` | Built-in method ID or a custom config object |
| `madhab` | `'Hanafi' \| 'Shafi'` | `'Shafi'` | Asr shadow-ratio school |
| `elevation` | `number \| ElevationInput` | `0` | Observer elevation for altitude dip correction |
| `temperatureC` | `number` | `10` | Ambient temperature for atmospheric refraction |
| `pressureMbar` | `number` | `1010` | Atmospheric pressure for refraction |
| `resolveTimezoneAsync` | `Function` | — | Hook for async timezone lookup (e.g. via a geo-API) |
| `adjustments` | `Partial<Record<…, number>>` | — | Per-prayer minute offsets |
| `withMetadata` | `boolean` | `false` | Include debug metadata (DEC, EOT, iterations) |
| `highLatitudeStrategy` | `string` | — | Strategy for polar / high-latitude twilight |
| `regionalFallbackLatitude` | `number` | `45` | Fallback latitude when polar twilight is detected |

---

#### `CoordinateInput`

```ts
type CoordinateInput = number | string | DMSTuple;
```

Accepted forms:
- `number` — decimal degrees, e.g. `51.5074`
- `string` — e.g. `"51.5074"` or DMS string `"51°30'26.6\"N"`
- `DMSTuple` — `{ degrees, minutes, seconds, direction }`

---

#### `ElevationInput`

```ts
interface ElevationInput {
  readonly value: number;
  readonly unit: 'meters' | 'feet';
}
```

---

#### `TimeField`

One prayer's computed time, in three representations.

```ts
interface TimeField {
  readonly utc:       string | null;   // ISO 8601 UTC, e.g. "2024-04-09T01:41:00Z"
  readonly local:     string | null;   // Display text in target timezone, e.g. "04:41 AM"
  readonly timestamp: number | null;   // UNIX epoch milliseconds
  readonly status:    PrayerStatus;
}
```

---

#### `PrayerStatus`

Indicates why a time may be `null`.

```ts
type PrayerStatus =
  | 'SUCCESS'
  | 'CONTINUOUS_TWILIGHT'   // Sun stays below a fixed angle; Fajr/Isha cannot be resolved
  | 'ASTRONOMICAL_MIDNIGHT' // Edge case near polar regions
  | 'POLAR_NIGHT'           // Sun never rises
  | 'POLAR_DAY'             // Sun never sets
  | 'REGIONAL_FALLBACK';    // High-latitude strategy applied a nearest-latitude fallback
```

---

#### `PrayerTimesResult`

```ts
interface PrayerTimesResult {
  readonly fajr:        TimeField;
  readonly sunrise:     TimeField;
  readonly dhahwaKubra: TimeField;   // Ḍuḥā al-Kubrā (Ishrāq)
  readonly dhuhr:       TimeField;
  readonly asr:         TimeField;
  readonly maghrib:     TimeField;
  readonly isha:        TimeField;
  readonly metadata?:   PrayerMetadata;
}
```

---

#### `PrayerMetadata`

Returned when `withMetadata: true`. Contains per-prayer astronomical diagnostics.

```ts
interface PrayerMetadata {
  readonly fajr?:    { DEC: number; EOT: number; angle: number; iterations: number };
  readonly sunrise?: { DEC: number; EOT: number; HP: number; SD: number; iterations: number };
  readonly dhuha?:   { DEC: number; EOT: number; iterations: number };
  readonly dhuhr?:   { DEC: number; EOT: number; SD: number; iterations: number };
  readonly asr?:     { DEC: number; EOT: number; HP: number; SD: number; asrAngle: number; iterations: number };
  readonly maghrib?: { DEC: number; EOT: number; HP: number; SD: number; iterations: number };
  readonly isha?:    { DEC: number; EOT: number; angle?: number; iterations: number };
}
```

---

#### `PrayerMethodConfig`

Shape of a custom calculation method.

```ts
interface PrayerMethodConfig {
  readonly id:              string;
  readonly name:            string;
  readonly fajrAngle:       number;
  readonly ishaAngle:       number | null;
  readonly ishaMinutes?:    number;     // Minutes after Maghrib (used when ishaAngle is null)
  readonly maghribAngle?:   number;     // Used by Tehran/Jafari methods
  readonly maghribMinutes?: number;
  readonly source:          string;
}
```

---

### 2.3 Enums & Constants

#### `Madhab`

```ts
enum Madhab {
  SHAFI  = 'Shafi',
  HANAFI = 'Hanafi'
}
```

- **Shafi** — Asr when shadow = 1× object height (used by Shafi'i, Maliki, Hanbali)
- **Hanafi** — Asr when shadow = 2× object height

---

#### `BUILT_IN_METHODS`

```ts
const BUILT_IN_METHODS: Record<string, PrayerMethodConfig>
```

| Key | Name | Fajr° | Isha° |
|---|---|---|---|
| `MWL` | Muslim World League | 18° | 17° |
| `ISNA` | Islamic Society of North America | 15° | 15° |
| `Egypt` | Egyptian General Authority of Survey | 19.5° | 17.5° |
| `Makkah` | Umm al-Qura University, Makkah | 18.5° | 90 min after Maghrib |
| `UmmAlQura` | Umm al-Qura University, Makkah | 18.5° | 90 min after Maghrib |
| `Karachi` | University of Islamic Sciences, Karachi | 18° | 18° |
| `Tehran` | Institute of Geophysics, Tehran | 17.7° | 14° |
| `Jafari` | Shia Ithna-Ashari, Leva Institute, Qum | 16° | 14° |

---

#### High-Latitude Strategies

Passed as `highLatitudeStrategy` in `PrayerConfig`.

| Value | Description |
|---|---|
| `'AngleBased'` | Scale Fajr/Isha using the twilight angle proportion of the night |
| `'MiddleOfNight'` | Place Fajr at midnight + 1/2 night, Isha at midnight − 1/2 night |
| `'SeventhOfNight'` | Use 1/7 of the night duration on each side of midnight |
| `'NearestLatitude'` | Fall back to the calculation at a specified moderate latitude (default 45°) |

---

## 3. Qibla Module

**Import path:** `tauqeet-js` or `tauqeet-js/qibla`

### 3.1 Functions

#### `getQiblaDirection(coordinates)`

Calculates the great-circle bearing and distance to the Kaaba.

```ts
function getQiblaDirection(coordinates: QiblaCoordinates): QiblaDirectionResult
```

| Parameter | Type | Description |
|---|---|---|
| `coordinates.latitude` | `number` | Observer latitude, −90 to +90 |
| `coordinates.longitude` | `number` | Observer longitude, −180 to +180 |

**Returns:** [`QiblaDirectionResult`](#qiblacirectionresult)  
**Throws:** `RangeError` if coordinates are out of range.

---

#### `getQiblaAdvanced(coordinates)`

Like `getQiblaDirection`, plus the rhumb-line (loxodromic) bearing.

```ts
function getQiblaAdvanced(coordinates: QiblaCoordinates): QiblaAdvancedResult
```

**Returns:** [`QiblaAdvancedResult`](#qiblaadvancedresult)

---

#### `getQiblaDistance(coordinates)`

Returns only the great-circle distance to the Kaaba.

```ts
function getQiblaDistance(coordinates: QiblaCoordinates): QiblaDistanceResult
```

---

### 3.2 Types

#### `QiblaCoordinates`

```ts
interface QiblaCoordinates {
  readonly latitude:  number;  // decimal degrees, -90 to +90
  readonly longitude: number;  // decimal degrees, -180 to +180
}
```

#### `QiblaDirectionResult`

```ts
interface QiblaDirectionResult {
  readonly bearing:    number | null;  // Great-circle bearing 0..360°; null if at Kaaba
  readonly distanceKm: number;
}
```

#### `QiblaAdvancedResult`

Extends `QiblaDirectionResult`:

```ts
interface QiblaAdvancedResult extends QiblaDirectionResult {
  readonly rhumbBearing: number | null;  // Rhumb-line bearing; null if at Kaaba
}
```

#### `QiblaDistanceResult`

```ts
interface QiblaDistanceResult {
  readonly distanceKm: number;
}
```

---

## 4. Solar Alignment Module

**Import path:** `tauqeet-js`

The solar alignment module calculates the UTC times when the sun aligns with (or is perpendicular to) the Qibla direction. This is useful for compass calibration without a compass.

### 4.1 Functions

#### `getSunAtQibla(config)`

```ts
function getSunAtQibla(config: SunAlignmentConfig): SunAtQiblaResult
```

| Parameter | Type | Description |
|---|---|---|
| `config.latitude` | `number` | Observer latitude |
| `config.longitude` | `number` | Observer longitude |
| `config.date` | `Date` (optional) | Date of interest; defaults to today |
| `config.timeZone` | `string \| number` (optional) | IANA name or numeric offset |

**Returns:** [`SunAtQiblaResult`](#sunatqiblaresult)  
**Throws:** `RangeError` if coordinates are invalid.

---

### 4.2 Types

#### `SunAlignmentConfig`

```ts
interface SunAlignmentConfig {
  readonly latitude:   number;
  readonly longitude:  number;
  readonly date?:      Date;
  readonly timeZone?:  string | number;
}
```

#### `SolarTimeField`

```ts
interface SolarTimeField {
  readonly time:  Date;    // UTC Date object
  readonly local: string;  // Formatted local-time string
}
```

#### `SunAtQiblaResult`

```ts
interface SunAtQiblaResult {
  readonly qiblaAlignment:            SolarTimeField | null;  // Sun faces Kaaba
  readonly antiQiblaAlignment:        SolarTimeField | null;  // Shadow faces Kaaba
  readonly rightPerpendicularAlignment: SolarTimeField | null;  // Kaaba to the right
  readonly leftPerpendicularAlignment:  SolarTimeField | null;  // Kaaba to the left
}
```

> **Note:** A `null` field means the sun does not reach that alignment on the given date at that location (common near polar regions or at high declinations).

---

## 5. Moon Module

**Import path:** `tauqeet-js` or `tauqeet-js/moon`

### 5.1 Phase & Age Functions

#### `getMoonPhase(date)`

Calculates the moon's phase, elongation, and illuminated fraction for a given UTC date.

```ts
function getMoonPhase(date: Date): MoonPhaseResult
```

**Returns:** [`MoonPhaseResult`](#moonphaseresult)

---

#### `getMoonAge(date)`

Calculates the age of the moon (days since last new moon) for a given UTC date.

```ts
function getMoonAge(date: Date): MoonAgeResult
```

**Returns:** [`MoonAgeResult`](#moonageresult)

---

#### `getMoonIllumination(date)`

Returns the moon's illuminated fraction for a given UTC date.

```ts
function getMoonIllumination(date: Date): number
```

**Returns:** A value 0..1 (0 = new moon, 1 = full moon).

---

### 5.2 Lunar Event Functions

All four functions accept a `Date` and return a `Date` (UTC) of the event.

| Function | Description |
|---|---|
| `getNextNewMoon(afterDate)` | Next new moon after the given date |
| `getPreviousNewMoon(beforeDate)` | Most recent new moon before the given date |
| `getNextFullMoon(afterDate)` | Next full moon after the given date |
| `getPreviousFullMoon(beforeDate)` | Most recent full moon before the given date |

```ts
function getNextNewMoon(afterDate: Date): Date
function getPreviousNewMoon(beforeDate: Date): Date
function getNextFullMoon(afterDate: Date): Date
function getPreviousFullMoon(beforeDate: Date): Date
```

---

#### `getSunset(date, latitude, longitude)`

Returns the UTC time of sunset at the given location, or `null` if the sun does not set (polar day).

```ts
function getSunset(date: Date, latitude: number, longitude: number): Date | null
```

---

### 5.3 Visibility Functions

#### `checkVisibility(params)`

Evaluates crescent moon visibility at a specific location and date using a single criterion.

```ts
function checkVisibility(params: CheckVisibilityParams): VisibilityResult
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `params.date` | `Date` | ✅ | Date of the evening observation |
| `params.latitude` | `number` | ✅ | Observer latitude |
| `params.longitude` | `number` | ✅ | Observer longitude |
| `params.elevation` | `number` | — | Observer elevation in metres |
| `params.method` | `VisibilityMethod` | ✅ | Which criterion to apply |

**Returns:** [`VisibilityResult`](#visibilityresult)

---

#### `checkMultipleCriteria(params)`

Runs all three criteria (Odeh, Yallop, HMNAO) simultaneously.

```ts
function checkMultipleCriteria(
  params: Omit<CheckVisibilityParams, 'method'>
): VisibilityResult[]
```

**Returns:** Array of three `VisibilityResult` objects (one per criterion), or `[]` if the sun does not set.

---

#### Criterion Classes (Advanced)

For users who want to supply their own `VisibilityInput` directly:

| Class | Method | Description |
|---|---|---|
| `OdehCriterion` | `evaluate(input)` | Altitude ≥ 5°, elongation ≥ 8°, age ≥ 15 h |
| `YallopCriterion` | `evaluate(input)` | Yallop *q*-value polynomial (categories A–F) |
| `HMNAOCriterion` | `evaluate(input)` | HM Nautical Almanac Office criterion |

Each implements the `VisibilityCriterion` interface:

```ts
interface VisibilityCriterion {
  name: string;
  evaluate(input: VisibilityInput): VisibilityResult;
  isVisible(input: VisibilityInput): boolean;
}
```

---

### 5.4 Types & Enums

#### `MoonPhaseResult`

```ts
interface MoonPhaseResult {
  elongation:          number;   // Moon–Sun elongation in degrees (0..360)
  illuminatedFraction: number;   // 0 (new) to 1 (full)
  phaseAngle?:         number;   // degrees
  phaseName?:          string;   // 'New' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous'
                                 // | 'Full' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent'
}
```

#### `MoonAgeResult`

```ts
interface MoonAgeResult {
  ageDays:         number;  // Days since the last new moon (0..~29.53)
  previousNewMoon: Date;    // UTC Date of the most recent new moon
}
```

#### `MoonEventResult`

```ts
interface MoonEventResult {
  date: Date;  // UTC Date of the lunar event
}
```

#### `VisibilityInput`

```ts
interface VisibilityInput {
  sunset:                Date;
  moonset?:              Date;
  moonAltitudeAtSunset:  number;   // degrees above horizon
  moonAzimuthAtSunset:   number;   // degrees from north
  elongation:            number;   // Moon–Sun elongation in degrees
  moonAgeHours:          number;   // hours since last new moon
  arcv?:                 number;   // altitude difference moon − sun
  arcl?:                 number;   // elongation (sometimes distinguished from arcv)
}
```

#### `VisibilityResult`

```ts
interface VisibilityResult {
  criterionName: string;
  visible:       boolean;
  confidence?:   number;           // 0..1
  category?:     string;           // Yallop: 'A'–'F'; others may vary
  details?:      Record<string, any>;
}
```

#### `VisibilityMethod`

```ts
enum VisibilityMethod {
  ODEH   = 'odeh',
  YALLOP = 'yallop',
  HMNAO  = 'hmnao'
}
```

---

## 6. Hijri Module

**Import path:** `tauqeet-js` or `tauqeet-js/hijri`

### 6.1 Convenience Functions

#### `toHijri(date, method?, options?)`

Converts a Gregorian `Date` to a `HijriDate`.

```ts
function toHijri(
  date:    Date,
  method?: HijriMethod,
  options?: { location?: HijriLocationOptions }
): HijriDate
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `date` | `Date` | — | Gregorian date to convert |
| `method` | `HijriMethod` | `CIVIL` | Conversion method |
| `options.location` | `HijriLocationOptions` | — | Required when `method` is `VISIBILITY` |

---

#### `toGregorian(hijriDate, method?, options?)`

Converts a `HijriDate` back to a Gregorian `Date`.

```ts
function toGregorian(
  hijriDate: HijriDate,
  method?:   HijriMethod,
  options?:  { location?: HijriLocationOptions }
): Date
```

---

### 6.2 HijriEngine Class

The central façade for Hijri calendar operations. Use this when you need multiple conversions with the same method, or when you want calendar grid generation.

```ts
class HijriEngine {
  constructor(
    method?:  HijriMethod,       // default: CIVIL
    options?: HijriEngineOptions
  )

  toHijri(date: Date): HijriDate
  toGregorian(hijriDate: HijriDate): Date
  getMonthGrid(year: number, month: number): (HijriDate | null)[][]
}
```

#### `getMonthGrid(year, month)`

Builds a 7-column (Sun → Sat) calendar grid for a Hijri month. Cells are `HijriDate` objects, with `null` for padding days.

```ts
const engine = new HijriEngine(HijriMethod.CIVIL);
const grid = engine.getMonthGrid(1446, 9); // Ramadan 1446
```

#### `HijriEngineOptions`

```ts
interface HijriEngineOptions {
  location?: HijriLocationOptions;  // Required for VISIBILITY method
}
```

---

### 6.3 Calendar Classes

Advanced users can instantiate calendars directly:

| Class | Method | Notes |
|---|---|---|
| `CivilCalendar` | `CIVIL` | Pure arithmetic 30-year cycle |
| `ConjunctionCalendar` | `CONJUNCTION` | Astronomical new moon (UTC conjunction) |
| `VisibilityCalendar` | `VISIBILITY` | Location-aware crescent sighting |
| `UmmAlQuraCalendar` | `UMM_AL_QURA` | Official Saudi calendar |

Each exposes:
```ts
toHijri(date: Date): HijriDate
toGregorian(hijriDate: HijriDate): Date
```

---

### 6.4 Types & Enums

#### `HijriDate`

```ts
interface HijriDate {
  year:  number;   // Anno Hegirae (AH)
  month: number;   // 1 = Muharram .. 12 = Dhul Hijja
  day:   number;   // 1–29 or 1–30
}
```

#### `HijriMethod`

```ts
enum HijriMethod {
  CIVIL       = 'civil',       // Arithmetic 30-year cycle
  CONJUNCTION = 'conjunction', // Astronomical new moon (UTC)
  VISIBILITY  = 'visibility',  // Crescent sighting at observer location
  UMM_AL_QURA = 'ummAlQura'   // Official Saudi calendar
}
```

#### `HijriCalendarResult`

```ts
interface HijriCalendarResult {
  hijriDate:     HijriDate;
  gregorianDate: string;    // ISO string of corresponding Gregorian date (UTC midnight)
  method:        string;
}
```

#### `HijriLocationOptions`

```ts
interface HijriLocationOptions {
  latitude:   number;
  longitude:  number;
  elevation?: number;  // metres
}
```

#### `HIJRI_MONTH_NAMES`

```ts
const HIJRI_MONTH_NAMES: readonly string[] = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Ula', 'Jumada al-Akhira', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijja'
]
```

---

### 6.5 Core Helpers

Exported for advanced / library users:

| Function / Constant | Description |
|---|---|
| `getCivilMonthLength(year, month)` | Days in a Civil Hijri month (29 or 30) |
| `isCivilLeapYear(year)` | `true` if the year has 355 days |
| `getCivilYearLength(year)` | 354 (common) or 355 (leap) |
| `HIJRI_EPOCH_JD` | Julian Day of the Hijri epoch (1 Muharram 1 AH) |
