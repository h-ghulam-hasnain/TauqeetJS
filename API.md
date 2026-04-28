# TauqeetJS API Reference

This document provides a detailed reference for the TauqeetJS core API.

## Main Functions

### `getPrayerTimes(config: PrayerConfig)`

Calculates prayer times for a given location and date.

- **Parameters**: `config: PrayerConfig`
- **Returns**: `Result<PrayerTimesResult>`

---

## Interfaces & Types

### `PrayerConfig`

The configuration object for calculations.

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `location` | `Coordinates` | **Required** | Latitude, longitude, and optional elevation. |
| `date` | `Date` | `new Date()` | The date for which to calculate times. |
| `method` | `CalculationMethod` | `'Karachi'` | Preset for Fajr/Isha angles. |
| `madhab` | `'Shafi' \| 'Hanafi'` | `'Hanafi'` | Influences Asr shadow factor (1 vs 2). |
| `elevation` | `number` | `0` | Elevation in meters. Adjusts Sunrise/Maghrib. |
| `temperature` | `number` | `10` | Ambient temperature in Celsius for refraction. |
| `pressure` | `number` | `1013.25` | Atmospheric pressure in hPa/mbar for refraction. |
| `adjustments` | `Object` | `{}` | Manual minute offsets for each prayer. |

### `Coordinates`

```typescript
interface Coordinates {
  latitude: number;   // -90 to 90
  longitude: number;  // -180 to 180
  elevation?: number; // meters above sea level
}
```

### `PrayerTimesResult`

```typescript
interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhahwaKubra: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  format?: (type: 'iso8601' | 'unix' | '12h' | '24h', timeZone?: string) => Record<string, any>;
}
```

---

## Error Handling

### `Result<T, E>`

TauqeetJS uses a functional approach to error handling to prevent runtime exceptions.

```typescript
type Result<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E };
```

#### Validation
The `validateInputs` function is called internally but can be used externally to check parameters before calculation:

```typescript
import { validateInputs } from 'tauqeetjs';

const validation = validateInputs(lat, lng, date);
if (!validation.success) {
  console.log(validation.error); // "Invalid latitude: ..."
}
```

---

## Constants & Presets

### `CalculationMethod`

Supported presets for Fajr and Isha angles:

- `MWL`: Muslim World League (18°, 17°)
- `ISNA`: Islamic Society of North America (15°, 15°)
- `Egypt`: Egyptian General Authority of Survey (19.5°, 17.5°)
- `Makkah`: Umm al-Qura University (18.5°, 90 min after Maghrib)
- `Karachi`: University of Islamic Sciences (18°, 18°)
- `Tehran`: Institute of Geophysics (17.7°, 14°)
- `Jafari`: Shia Ithna-Ashari (16°, 14°)

---

## Atmospheric Adjustments

TauqeetJS implements high-precision astronomical algorithms that account for atmospheric conditions.

### Elevation (Vertical Shift)
At higher elevations, the horizon "drops," causing the sun to rise earlier and set later. TauqeetJS applies a geometric correction:
`dip = 0.0347 * sqrt(elevation)`

### Refraction (Temperature & Pressure)
The density of air affects how light bends near the horizon.
- **Temperature**: Default is 10°C. Lower temperatures increase air density and refraction.
- **Pressure**: Default is 1013.25 hPa. Higher pressure increases refraction.

These adjustments specifically impact **Sunrise** and **Maghrib** timings.
