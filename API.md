# API Reference

> Latest interactive reference: [https://tauqeet-js.web.app](https://tauqeet-js.web.app)

This document covers the public API surface of tauqeet-js as shipped in v1.1.3. The module exports below are the ones available from the package entry points and the module subpath exports.

For deeper usage guidance, see [ERROR_HANDLING.md](ERROR_HANDLING.md), [CONFIGURATION.md](CONFIGURATION.md), and [PERFORMANCE.md](PERFORMANCE.md).

---

## Common Result Types

### Result<T>

```ts
type Result<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };
```

Used by the legacy-compatible helpers `getPrayerTimes()` and `getPrayerTimesAsync()`.

```ts
import { getPrayerTimes } from 'tauqeet-js';

const result = getPrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  timeZone: 'Europe/London',
});

if (result.success) {
  console.log(result.data.fajr.local);
} else {
  console.error(result.error);
}
```

### Helper constructors

```ts
function Success<T>(data: T): Result<T>;
function Failure(error: string): Result<never>;
```

---

## Prayers Module

Import from `tauqeet-js/prayers` or the main entry point.

### Functions

#### calculatePrayerTimes

```ts
function calculatePrayerTimes(config: PrayerConfig): PrayerTimesResult;
```

- Computes prayer times synchronously.
- Throws `PrayerCalculationError` when validation or calculation fails.

Basic example:

```ts
import { calculatePrayerTimes } from 'tauqeet-js/prayers';

const times = calculatePrayerTimes({
  lat: 21.4225,
  long: 39.8262,
  timeZone: 'Asia/Riyadh',
});

console.log(times.fajr.local);
```

Advanced example:

```ts
import { calculatePrayerTimes, Madhab } from 'tauqeet-js/prayers';

const times = calculatePrayerTimes({
  lat: 21.4225,
  long: 39.8262,
  timeZone: 'Asia/Riyadh',
  madhab: Madhab.HANAFI,
  highLatitudeStrategy: 'NearestLatitude',
  withMetadata: true,
});

console.log(times.metadata?.fajr?.iterations);
```

#### calculatePrayerTimesAsync

```ts
function calculatePrayerTimesAsync(config: PrayerConfig): Promise<PrayerTimesResult>;
```

- Loads the VSOP87 tables lazily before the calculation.
- Supports async timezone resolution through `resolveTimezoneAsync`.

Basic example:

```ts
import { calculatePrayerTimesAsync } from 'tauqeet-js/prayers';

const times = await calculatePrayerTimesAsync({
  lat: 40.7128,
  long: -74.006,
  timeZone: 'America/New_York',
});
```

Advanced example:

```ts
import { calculatePrayerTimesAsync } from 'tauqeet-js/prayers';

const times = await calculatePrayerTimesAsync({
  lat: 40.7128,
  long: -74.006,
  timeZone: 'America/New_York',
  resolveTimezoneAsync: async () => 'America/New_York',
  withMetadata: true,
});
```

#### getPrayerTimes

```ts
function getPrayerTimes(config: PrayerConfig): Result<PrayerTimesResult>;
```

- Safe wrapper around `calculatePrayerTimes()`.
- Returns a `Result` instead of throwing for common failures.

Basic example:

```ts
import { getPrayerTimes } from 'tauqeet-js/prayers';

const result = getPrayerTimes({ lat: 31.5, long: 74.35, timeZone: 'Asia/Karachi' });
if (result.success) {
  console.log(result.data.fajr.local);
}
```

Advanced example:

```ts
import { getPrayerTimes } from 'tauqeet-js/prayers';

const result = getPrayerTimes({
  lat: 31.5,
  long: 74.35,
  timeZone: 'Asia/Karachi',
  method: {
    id: 'Custom',
    name: 'Custom',
    fajrAngle: 18,
    ishaAngle: 18,
    source: 'Example',
  },
});
```

#### getPrayerTimesAsync

```ts
function getPrayerTimesAsync(config: PrayerConfig): Promise<Result<PrayerTimesResult>>;
```

Basic example:

```ts
import { getPrayerTimesAsync } from 'tauqeet-js/prayers';

const result = await getPrayerTimesAsync({
  lat: 48.8566,
  long: 2.3522,
  timeZone: 'Europe/Paris',
});
```

Advanced example:

```ts
import { getPrayerTimesAsync } from 'tauqeet-js/prayers';

const result = await getPrayerTimesAsync({
  lat: 48.8566,
  long: 2.3522,
  resolveTimezoneAsync: async () => 'Europe/Paris',
});
```

#### resolveTimeZoneSync

```ts
function resolveTimeZoneSync(explicitTimeZone?: string | number, onFallback?: (reason: string) => void): string | number;
```

- Resolves the effective timezone value.
- Falls back to `Intl` detection or UTC.

Basic example:

```ts
import { resolveTimeZoneSync } from 'tauqeet-js/prayers';

const tz = resolveTimeZoneSync();
console.log(tz);
```

Advanced example:

```ts
import { resolveTimeZoneSync } from 'tauqeet-js/prayers';

const tz = resolveTimeZoneSync(undefined, reason => console.warn(reason));
```

#### formatPrayerTimes

```ts
function formatPrayerTimes<T extends 'iso8601' | 'unix' | '12h' | '24h'>(
  times: Omit<PrayerTimesResult, 'metadata'>,
  type: T,
  timeZone?: string
): Result<FormattedTimes<T>>;
```

- Formats prayer timestamps into ISO strings, Unix timestamps, or human-readable time strings.
- Returns `Failure` when `Intl` formatting fails for a provided timezone.

Basic example:

```ts
import { calculatePrayerTimes, formatPrayerTimes } from 'tauqeet-js/prayers';

const times = calculatePrayerTimes({ lat: 31.5, long: 74.35, timeZone: 'Asia/Karachi' });
const formatted = formatPrayerTimes(times, '24h');
```

Advanced example:

```ts
import { calculatePrayerTimes, formatPrayerTimes } from 'tauqeet-js/prayers';

const times = calculatePrayerTimes({ lat: 31.5, long: 74.35, timeZone: 'Asia/Karachi' });
const formatted = formatPrayerTimes(times, '12h', 'Europe/London');
```

### Types

```ts
type PrayerStatus =
  | 'SUCCESS'
  | 'CONTINUOUS_TWILIGHT'
  | 'ASTRONOMICAL_MIDNIGHT'
  | 'POLAR_NIGHT'
  | 'POLAR_DAY'
  | 'REGIONAL_FALLBACK';
```

```ts
type CoordinateInput = number | string | DMSTuple;
```

```ts
interface DMSTuple {
  readonly degrees: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly direction: 'N' | 'S' | 'E' | 'W' | 'n' | 's' | 'e' | 'w';
}
```

```ts
interface ElevationInput {
  readonly value: number;
  readonly unit: 'meters' | 'feet';
}
```

```ts
interface PrayerMethodConfig {
  readonly id: string;
  readonly name: string;
  readonly fajrAngle: number;
  readonly ishaAngle: number | null;
  readonly ishaMinutes?: number;
  readonly maghribAngle?: number;
  readonly maghribMinutes?: number;
  readonly source: string;
  readonly asrShadowMultiplier?: number;
  readonly twilightType?: 'White' | 'Red' | 'Custom';
  readonly description?: string;
  readonly isDefault?: boolean;
}
```

```ts
interface PrayerConfig {
  readonly lat: CoordinateInput;
  readonly long: CoordinateInput;
  readonly timeZone?: string | number;
  readonly date?: Date | number | string;
  readonly method?: string | PrayerMethodConfig;
  readonly madhab?: 'Hanafi' | 'Shafi' | 'Maliki' | 'Hanbali' | 'Jaafari' | 'Jafari';
  readonly elevation?: number | ElevationInput;
  readonly temperatureC?: number;
  readonly pressureMbar?: number;
  readonly resolveTimezoneAsync?: (lat: number, lon: number) => Promise<string> | string;
  readonly adjustments?: Partial<Record<'fajr' | 'sunrise' | 'dhahwaKubra' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number>>;
  readonly withMetadata?: boolean;
  readonly highLatitudeStrategy?: 'AngleBased' | 'MiddleOfNight' | 'SeventhOfNight' | 'NearestLatitude';
  readonly regionalFallbackLatitude?: number;
}
```

```ts
interface TimeField {
  readonly utc: string | null;
  readonly local: string | null;
  readonly timestamp: number | null;
  readonly status: PrayerStatus;
}
```

```ts
interface PrayerMetadata {
  readonly fajr?: { readonly DEC: number; readonly EOT: number; readonly angle: number; readonly iterations: number };
  readonly sunrise?: { readonly DEC: number; readonly EOT: number; readonly HP: number; readonly SD: number; readonly iterations: number };
  readonly dhuha?: { readonly DEC: number; readonly EOT: number; readonly iterations: number };
  readonly dhuhr?: { readonly DEC: number; readonly EOT: number; readonly SD: number; readonly iterations: number };
  readonly asr?: { readonly DEC: number; readonly EOT: number; readonly HP: number; readonly SD: number; readonly asrAngle: number; readonly iterations: number };
  readonly maghrib?: { readonly DEC: number; readonly EOT: number; readonly HP: number; readonly SD: number; readonly iterations: number };
  readonly isha?: { readonly DEC: number; readonly angle?: number; readonly iterations: number };
}
```

```ts
interface PrayerTimesResult {
  readonly fajr: TimeField;
  readonly sunrise: TimeField;
  readonly dhahwaKubra: TimeField;
  readonly dhuhr: TimeField;
  readonly asr: TimeField;
  readonly maghrib: TimeField;
  readonly isha: TimeField;
  readonly metadata?: PrayerMetadata;
}
```

---

## Qibla Module

Import from `tauqeet-js/qibla` or the main entry point.

### Functions

#### getQiblaDirection

```ts
function getQiblaDirection(coordinates: QiblaCoordinates): QiblaDirectionResult;
```

Basic example:

```ts
import { getQiblaDirection } from 'tauqeet-js/qibla';

const result = getQiblaDirection({ latitude: 51.5074, longitude: -0.1278 });
console.log(result.bearing);
```

Advanced example:

```ts
import { getQiblaDirection } from 'tauqeet-js/qibla';

const result = getQiblaDirection({ latitude: 21.4225, longitude: 39.8262 });
console.log(result.distanceKm.toFixed(1));
```

#### getQiblaAdvanced

```ts
function getQiblaAdvanced(coordinates: QiblaCoordinates): QiblaAdvancedResult;
```

Basic example:

```ts
import { getQiblaAdvanced } from 'tauqeet-js/qibla';

const result = getQiblaAdvanced({ latitude: 31.5, longitude: 74.35 });
console.log(result.rhumbBearing);
```

#### getQiblaDistance

```ts
function getQiblaDistance(coordinates: QiblaCoordinates): QiblaDistanceResult;
```

Basic example:

```ts
import { getQiblaDistance } from 'tauqeet-js/qibla';

const result = getQiblaDistance({ latitude: 40.7128, longitude: -74.0060 });
console.log(result.distanceKm);
```

### Types

```ts
interface QiblaCoordinates { readonly latitude: number; readonly longitude: number; }
interface QiblaDirectionResult { readonly bearing: number | null; readonly distanceKm: number; }
interface QiblaAdvancedResult extends QiblaDirectionResult { readonly rhumbBearing: number | null; }
interface QiblaDistanceResult { readonly distanceKm: number; }
```

### Constants

```ts
const MECCA: Readonly<{ latitude: number; longitude: number }>;
const EARTH_RADIUS_KM: 6371;
```

---

## Moon Module

Import from `tauqeet-js/moon` or the main entry point.

### Functions

#### getMoonPhase

```ts
function getMoonPhase(date: Date): MoonPhaseResult;
```

Basic example:

```ts
import { getMoonPhase } from 'tauqeet-js/moon';

const phase = getMoonPhase(new Date());
console.log(phase.phaseName);
```

Advanced example:

```ts
import { getMoonPhase } from 'tauqeet-js/moon';

const phase = getMoonPhase(new Date('2026-07-01T12:00:00Z'));
console.log(phase.illuminatedFraction);
```

#### getMoonAge

```ts
function getMoonAge(date: Date): MoonAgeResult;
```

#### getMoonIllumination

```ts
function getMoonIllumination(date: Date): number;
```

#### getNextNewMoon / getPreviousNewMoon / getNextFullMoon / getPreviousFullMoon

```ts
function getNextNewMoon(afterDate: Date): Date;
function getPreviousNewMoon(beforeDate: Date): Date;
function getNextFullMoon(afterDate: Date): Date;
function getPreviousFullMoon(beforeDate: Date): Date;
```

Basic example:

```ts
import { getNextNewMoon, getPreviousFullMoon } from 'tauqeet-js/moon';

console.log(getNextNewMoon(new Date()));
console.log(getPreviousFullMoon(new Date()));
```

Advanced example:

```ts
import { getNextNewMoon } from 'tauqeet-js/moon';

const nextNewMoon = getNextNewMoon(new Date('2026-01-01T00:00:00Z'));
console.log(nextNewMoon.toISOString());
```

#### checkVisibility

```ts
function checkVisibility(params: CheckVisibilityParams): VisibilityResult;
```

#### checkMultipleCriteria

```ts
function checkMultipleCriteria(params: Omit<CheckVisibilityParams, 'method'>): VisibilityResult[];
```

#### getSunset

```ts
function getSunset(date: Date, latitude: number, longitude: number): Date | null;
```

### Types

```ts
interface MoonPhaseResult {
  phase?: number;
  elongation: number;
  illuminatedFraction: number;
  phaseAngle?: number;
  phaseName?: string;
}
```

```ts
interface MoonAgeResult {
  ageDays: number;
  previousNewMoon: Date;
}
```

```ts
interface MoonEventResult {
  date: Date;
  type: 'new' | 'full';
}
```

```ts
interface VisibilityInput {
  sunset: Date;
  moonset?: Date;
  moonAltitudeAtSunset: number;
  moonAzimuthAtSunset: number;
  elongation: number;
  moonAgeHours: number;
  arcv?: number;
  arcl?: number;
}
```

```ts
interface VisibilityResult {
  criterionName: string;
  visible: boolean;
  confidence?: number;
  category?: string;
  details?: Record<string, unknown>;
}
```

```ts
enum VisibilityMethod {
  ODEH = 'odeh',
  YALLOP = 'yallop',
  HMNAO = 'hmnao',
}
```

```ts
interface CheckVisibilityParams {
  date: Date;
  latitude: number;
  longitude: number;
  elevation?: number;
  method: VisibilityMethod;
}
```

### Visibility criterion classes

```ts
class OdehCriterion implements VisibilityCriterion;
class YallopCriterion implements VisibilityCriterion;
class HMNAOCriterion implements VisibilityCriterion;
```

---

## Hijri Module

Import from `tauqeet-js/hijri` or the main entry point.

### Functions

#### toHijri

```ts
function toHijri(date: Date, method: HijriMethod = HijriMethod.CIVIL, options?: { location?: HijriLocationOptions }): HijriDate;
```

Basic example:

```ts
import { toHijri, HijriMethod } from 'tauqeet-js/hijri';

const hijri = toHijri(new Date(), HijriMethod.CIVIL);
console.log(hijri);
```

Advanced example:

```ts
import { toHijri, HijriMethod } from 'tauqeet-js/hijri';

const hijri = toHijri(new Date(), HijriMethod.VISIBILITY, {
  location: { latitude: 21.4225, longitude: 39.8262 },
});
```

#### toGregorian

```ts
function toGregorian(hijriDate: HijriDate, method: HijriMethod = HijriMethod.CIVIL, options?: { location?: HijriLocationOptions }): Date;
```

#### HijriEngine

```ts
class HijriEngine {
  constructor(method?: HijriMethod, options?: HijriEngineOptions);
  toHijri(date: Date): HijriDate;
  toGregorian(hijriDate: HijriDate): Date;
  getMonthGrid(year: number, month: number): (HijriDate | null)[][];
}
```

### Types

```ts
interface HijriDate { year: number; month: number; day: number; }
interface HijriCalendarResult { hijriDate: HijriDate; gregorianDate: string; method: string; }
interface HijriLocationOptions { latitude: number; longitude: number; elevation?: number; }
interface HijriEngineOptions { location?: HijriLocationOptions; }
```

```ts
enum HijriMethod {
  CIVIL = 'civil',
  CONJUNCTION = 'conjunction',
  VISIBILITY = 'visibility',
  UMM_AL_QURA = 'ummAlQura',
}
```

### Calendar classes

```ts
class CivilCalendar {}
class ConjunctionCalendar {}
class VisibilityCalendar {}
class UmmAlQuraCalendar {}
```

### Helper functions

```ts
function getCivilMonthLength(year: number, month: number): number;
function isCivilLeapYear(year: number): boolean;
function getCivilYearLength(year: number): number;
```

### Constants

```ts
const HIJRI_MONTH_NAMES: readonly string[];
const HIJRI_EPOCH_JD: number;
```

---

## Solar Alignment Module

Import from `tauqeet-js/solar-alignment` or the main entry point.

### Function

#### getSunAtQibla

```ts
function getSunAtQibla(config: SunAlignmentConfig): SunAtQiblaResult;
```

Basic example:

```ts
import { getSunAtQibla } from 'tauqeet-js/solar-alignment';

const result = getSunAtQibla({
  latitude: 21.4225,
  longitude: 39.8262,
  date: new Date('2026-07-01T00:00:00Z'),
});

console.log(result.qiblaAlignment?.time.toISOString());
```

Advanced example:

```ts
import { getSunAtQibla } from 'tauqeet-js/solar-alignment';

const result = getSunAtQibla({
  latitude: 31.5,
  longitude: 74.35,
  timeZone: 'Asia/Karachi',
});
```

### Types

```ts
interface SunAlignmentConfig {
  readonly latitude: number;
  readonly longitude: number;
  readonly date?: Date;
  readonly timeZone?: string | number;
}
```

```ts
interface SolarTimeField {
  readonly time: Date;
  readonly local: string;
}
```

```ts
interface SunAtQiblaResult {
  readonly qiblaAlignment: SolarTimeField | null;
  readonly antiQiblaAlignment: SolarTimeField | null;
  readonly rightPerpendicularAlignment: SolarTimeField | null;
  readonly leftPerpendicularAlignment: SolarTimeField | null;
}
```

---

## Notes

- The library validates coordinate and date input in the prayer and Qibla paths. See [CONFIGURATION.md](CONFIGURATION.md).
- For runtime and memory behaviour, see [PERFORMANCE.md](PERFORMANCE.md).
- For error-handling patterns, see [ERROR_HANDLING.md](ERROR_HANDLING.md).
