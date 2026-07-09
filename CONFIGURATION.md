# Prayer Configuration Deep Dive

This guide documents the prayer configuration model in tauqeet-js and the options available to customise calculations for different regions, madhhabs, and latitude conditions.

For the public function signatures, see [API.md](API.md). For error handling patterns, see [ERROR_HANDLING.md](ERROR_HANDLING.md).

---

## PrayerConfig

The main input object for prayer calculations is `PrayerConfig`.

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

### Coordinate inputs

Coordinates may be passed as:

- A decimal number.
- A DMS-style string such as `"21°25'21\"N"`.
- A `DMSTuple` object.

```ts
import { calculatePrayerTimes } from 'tauqeet-js/prayers';

calculatePrayerTimes({
  lat: { degrees: 21, minutes: 25, seconds: 21, direction: 'N' },
  long: { degrees: 39, minutes: 49, seconds: 24, direction: 'E' },
});
```

### Elevation input

Elevation can be provided either as a plain number in metres or as an `ElevationInput` object.

```ts
calculatePrayerTimes({
  lat: 21.4225,
  long: 39.8262,
  elevation: { value: 100, unit: 'meters' },
});
```

---

## Built-in Calculation Methods

The library ships with a set of built-in prayer methods that are selected by a `method` string or a complete custom `PrayerMethodConfig` object.

The built-in presets are exposed via `BUILT_IN_METHODS` and are scoped by madhhab.

```ts
import { BUILT_IN_METHODS, Madhab } from 'tauqeet-js/prayers';

console.log(BUILT_IN_METHODS[Madhab.SHAFI]);
```

### Common presets

- `MWL`
- `ISNA`
- `Egypt`
- `Karachi`
- `Makkah`
- `UmmAlQura`

The exact available presets depend on the selected madhhab and the built-in registry.

### How to use a built-in preset

```ts
import { calculatePrayerTimes } from 'tauqeet-js/prayers';

const result = calculatePrayerTimes({
  lat: 51.5074,
  long: -0.1278,
  timeZone: 'Europe/London',
  method: 'MWL',
  madhab: 'Shafi',
});
```

---

## Madhhab and Asr Settings

The `madhab` setting controls the shadow factor used for Asr.

```ts
import { calculatePrayerTimes, Madhab } from 'tauqeet-js/prayers';

calculatePrayerTimes({
  lat: 31.5,
  long: 74.35,
  madhab: Madhab.HANAFI,
});
```

The available madhhab values are:

- `Hanafi`
- `Shafi`
- `Maliki`
- `Hanbali`
- `Jaafari`
- `Jafari`

The `asrShadowMultiplier` field inside a custom method config can override the default shape of the Asr calculation.

---

## Fajr and Isha Angles

Two of the most important customisation knobs are `fajrAngle` and `ishaAngle`.

```ts
const customMethod = {
  id: 'Custom',
  name: 'Custom',
  fajrAngle: 18,
  ishaAngle: 17,
  source: 'Example',
};
```

- `fajrAngle` controls the morning twilight threshold.
- `ishaAngle` controls the evening twilight threshold.
- The validator constrains both values to the range $0^\circ$ to $30^\circ$.

These are useful when you want to align calculations with a particular local convention or school of thought.

---

## High-Latitude Strategies

In high-latitude regions, the standard sunrise/sunset-based definition can become ambiguous. The library supports the following strategies:

- `AngleBased`
- `MiddleOfNight`
- `SeventhOfNight`
- `NearestLatitude`

### AngleBased

Uses the configured twilight angle and a safe night duration to compute Fajr and Isha.

### MiddleOfNight

Uses the middle of the safe night duration when the regular calculation is ambiguous.

### SeventhOfNight

Uses one-seventh of the safe night duration.

### NearestLatitude

Uses a regional fallback latitude to compute the nearby prayer times when the local latitude is problematic.

```ts
import { calculatePrayerTimes } from 'tauqeet-js/prayers';

calculatePrayerTimes({
  lat: 70,
  long: 25,
  highLatitudeStrategy: 'NearestLatitude',
  regionalFallbackLatitude: 45,
});
```

---

## Adjustments and Metadata

You can offset individual times in minutes with the `adjustments` object.

```ts
import { calculatePrayerTimes } from 'tauqeet-js/prayers';

const result = calculatePrayerTimes({
  lat: 31.5,
  long: 74.35,
  adjustments: {
    fajr: 2,
    dhuhr: -1,
    maghrib: 1,
  },
});
```

Set `withMetadata: true` to receive solver diagnostics for each prayer.

```ts
const result = calculatePrayerTimes({
  lat: 31.5,
  long: 74.35,
  withMetadata: true,
});

console.log(result.metadata?.fajr?.iterations);
```

---

## Async Timezone Resolution

The `resolveTimezoneAsync` hook is useful when your application wants to resolve the effective timezone dynamically rather than using a fixed string.

```ts
import { calculatePrayerTimesAsync } from 'tauqeet-js/prayers';

const result = await calculatePrayerTimesAsync({
  lat: 40.7128,
  long: -74.006,
  resolveTimezoneAsync: async () => 'America/New_York',
});
```

Use this hook if:

- Your application decides the timezone from a user profile.
- Your environment has partial ICU or Intl support.
- You want to centralise timezone logic in one place.
