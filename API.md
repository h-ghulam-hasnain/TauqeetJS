# API Reference

> **Latest interactive version:** [https://tauqeet-js.web.app](https://tauqeet-js.web.app)

This document serves as the index for every public symbol exported by `tauqeet-js`. Symbols are grouped by their respective modules. 

For detailed API documentation, please refer to the specific module's documentation file:

- [Prayers Module API](docs/prayers.md)
- [Qibla & Solar Alignment API](docs/qibla-and-solar-alignment.md)
- [Moon Module API](docs/moon.md)
- [Hijri Module API](docs/hijri.md)

---

## Common Types

### `Result<T>`

A discriminated union used by legacy-compatible functions to avoid throwing exceptions.

```ts
type Result<T> =
  | { readonly success: true;  readonly data: T      }
  | { readonly success: false; readonly error: string };
```

**Usage pattern:**
```ts
import { getPrayerTimes } from 'tauqeet-js';

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

## 1. Prayers Module

See [**docs/prayers.md**](docs/prayers.md) for full details on:
- `calculatePrayerTimes`, `calculatePrayerTimesAsync`
- `getPrayerTimes`, `getPrayerTimesAsync`
- `PrayerConfig`, `PrayerTimesResult`, `PrayerStatus`, `Madhab`, `BUILT_IN_METHODS`

## 2. Qibla Module

See [**docs/qibla-and-solar-alignment.md**](docs/qibla-and-solar-alignment.md) for full details on:
- `getQiblaDirection`, `getQiblaAdvanced`, `getQiblaDistance`
- `QiblaCoordinates`, `QiblaDirectionResult`

## 3. Solar Alignment Module

See [**docs/qibla-and-solar-alignment.md**](docs/qibla-and-solar-alignment.md) for full details on:
- `getSunAtQibla`
- `SunAlignmentConfig`, `SunAtQiblaResult`

## 4. Moon Module

See [**docs/moon.md**](docs/moon.md) for full details on:
- `getMoonPhase`, `getMoonAge`, `getMoonIllumination`
- Lunar Events (`getNextNewMoon`, etc.)
- Visibility (`checkVisibility`, `checkMultipleCriteria`)

## 5. Hijri Module

See [**docs/hijri.md**](docs/hijri.md) for full details on:
- `toHijri`, `toGregorian`
- `HijriEngine`, Calendars (`CivilCalendar`, `UmmAlQuraCalendar`, etc.)
- `HijriMethod`, `HijriDate`

---

## Limitations & Error Types

This section documents important runtime constraints and the set of notable errors that library consumers should expect and handle.

- ΔT year range: the internal ΔT model used by the astronomy engine is valid within years -2000 through 3000. Calls that require ΔT outside this range will throw `RangeError` from `src/astronomy/time/DeltaT.ts`.

- Search convergence: eclipse and lunar event searches expose `maxMoons` and other limits; when a search does not find a result within the configured window a `SearchConvergenceError` (from `src/astronomy/errors.ts`) is thrown.

- Validation/configuration errors: invalid user input (bad date formats, non-finite numeric values, out-of-range coordinates) will produce `ConfigurationError` or `InvalidArgumentError` depending on the module. See specific module docs for exact thrown types.

- Heavy computations: full-precision VSOP87 evaluations and full-lunar-theory routines are CPU-intensive and synchronous — consider executing them in worker threads for production workloads.

For robust integration, prefer the `get*` helper APIs (e.g., `getPrayerTimes`) which return `Result<T>` wrappers and avoid throwing exceptions for common validation failures.
