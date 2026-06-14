# TauqeetJS API Reference

This document provides a detailed reference for the TauqeetJS core API and its modular extensions.

### Table of Contents
- [Core Prayer API](#core-prayer-api)
- [Schedules & Tables](#schedules--tables)
- [Qibla API](#qibla-api)
- [Moon Visibility API](#moon-visibility-api)
- [Metadata & Astronomical Data](#metadata--astronomical-data)
- [Engine Factories](#engine-factories)
- [Error Handling & Validation](#error-handling--validation)

---

## Core Prayer API

### `getPrayerTimes(config: PrayerConfig)`
Calculates prayer times for a given location and date.

- **Import**: `import { getPrayerTimes } from 'tauqeet-js/prayer'`
- **Parameters**: `config: PrayerConfig`
- **Returns**: `Result<PrayerTimesResult>`

### `PrayerConfig`
| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `location` | `Coordinates` | **Required** | Latitude, longitude, and optional elevation. |
| `date` | `Date` | `new Date()` | The date for which to calculate times. |
| `method` | `CalculationMethod` | `'Karachi'` | Preset for Fajr/Isha angles. |
| `madhab` | `'Shafi' \| 'Hanafi'` | `'Hanafi'` | Influences Asr shadow factor (1 vs 2). |
| `withMetadata` | `boolean` | `false` | If true, returns astronomical primitives. |
| `adjustments` | `Object` | `{}` | Manual minute offsets. |

### `getRamadanSchedule(startDate: Date, endDate: Date, config: Omit<PrayerConfig, 'date'>, sahurBuffer?: number, iftarBuffer?: number)`
Generates a Ramadan schedule over a date range, providing sahur and iftar entries for each day.

- **Import**: `import { getRamadanSchedule } from 'tauqeet-js/prayer'`
- **Parameters**:
  - `startDate`: Beginning of the Ramadan range.
  - `endDate`: End of the Ramadan range.
  - `config`: Prayer calculation configuration without `date`.
  - `sahurBuffer`: Optional minutes before Fajr for sahur end.
  - `iftarBuffer`: Optional minutes after Maghrib for iftar.
- **Returns**: `Result<RamadanScheduleEntry[]>`

---

## Moon Visibility API

### `getMoonVisibility(date, lat, lng, withMetadata?)`
Calculates high-precision Moonrise, Moonset, Transit, Phase, Age, and Lunar Distance.

- **Import**: `import { getMoonVisibility } from 'tauqeet-js/moon-visibility'`
- **Returns**: `Result<MoonVisibilityResult>`

#### `MoonVisibilityResult`
| Property | Type | Description |
| :--- | :--- | :--- |
| `rise`, `set`, `transit` | `Date` | Event times in UTC. |
| `phase` | `string` | Human-readable phase (e.g., "Waxing Crescent"). |
| `age` | `number` | Moon age in days. |
| `lunarDistance` | `number` | Angular distance from the Sun in degrees. |

---

## Metadata & Astronomical Data

When `withMetadata: true` is passed, the `PrayerTimesResult` includes a `metadata` object containing the exact astronomical primitives used in the final iteration of each prayer.

### Strict Metadata Mapping
| Prayer | Return Fields |
| :--- | :--- |
| **Fajr / Isha** | `DEC`, `EOT`, `angle`, `iterations` |
| **Sunrise / Maghrib** | `DEC`, `EOT`, `HP`, `SD`, `iterations` |
| **Asr** | `DEC`, `EOT`, `HP`, `SD`, `asrAngle`, `iterations` |
| **Dhuhr** | `DEC`, `EOT`, `SD`, `iterations` |

---

## Engine Factories

Factories allow for stateless engines that manage coordinate/method state via closures, providing a clean API for repeated calculations.

### `createPrayerEngine(coords, method)`
```typescript
import { createPrayerEngine } from 'tauqeet-js/factory';

const engine = createPrayerEngine({ latitude: 24.86, longitude: 67.01 });
const result = engine.calculate(new Date(), 2, 10, 1013, undefined, true);
```

---

## Error Handling & Validation

### `Result<T, E>`
TauqeetJS avoids `throws`. Every API returns a `Result` object.
```typescript
type Result<T, E = ErrorCode | string> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### `ErrorCode`
| Code | Description |
| :--- | :--- |
| `EXTREME_LATITUDE` | Sun does not rise/set at this location/date. |
| `CALCULATION_FAILED` | Internal solver failed to converge. |
| `INVALID_LATITUDE` | Latitude must be between -90 and 90. |
| `INVALID_LONGITUDE` | Longitude must be between -180 and 180. |

---

## Constants & Presets

### `CalculationMethod`
- `MWL`: Muslim World League (18°, 17°)
- `ISNA`: Islamic Society of North America (15°, 15°)
- `Egypt`: Egyptian General Authority of Survey (19.5°, 17.5°)
- `Makkah`: Umm al-Qura University (18.5°, 90 min after Maghrib)
- `Karachi`: University of Islamic Sciences (18°, 18°)
- `Tehran`: Institute of Geophysics (17.7°, 14°)
- `Jafari`: Shia Ithna-Ashari (16°, 14°)
