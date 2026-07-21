# Error Handling Guide

This guide documents the error-model used by tauqeet-js. The library combines typed `Error` subclasses, rigorous pre-computation validation layers, and the `Result<T>` wrapper pattern so applications can choose between throwing and safe, non-throwing flows.

For usage patterns, see [API.md](API.md) and [CONFIGURATION.md](CONFIGURATION.md).

---

## Overview

There are three common patterns in the library:

1. Throwing APIs such as `calculatePrayerTimes()` and `calculatePrayerTimesAsync()`.
2. Safe wrappers such as `getPrayerTimes()` and `getPrayerTimesAsync()` that return a discriminated `Result` object.
3. Special-purpose diagnostics for timezone formatting and fallback paths.

---

## Error Classes

### PrayerCalculationError

```ts
class PrayerCalculationError extends Error {
  constructor(message: string);
}
```

Used by the prayer engine when a calculation cannot be completed after validation. Typical causes include:

- Invalid or unsupported prayer configuration.
- Failure to resolve timezone or format a local time.
- Internal solver failure or unsupported high-latitude state.

Example:

```ts
import { calculatePrayerTimes } from 'tauqeet-js/prayers';

try {
  calculatePrayerTimes({ lat: 31.5, long: 74.35, timeZone: 'Asia/Karachi' });
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

### ConfigurationError

```ts
class ConfigurationError extends Error {
  constructor(message: string);
}
```

Raised when a configuration object is malformed or contains unsupported values. This is used during validation and parsing of prayer configuration and date inputs.

### InvalidArgumentError

```ts
class InvalidArgumentError extends Error {
  constructor(message: string);
}
```

Used exclusively by the core internal components to form an impenetrable validation boundary. If an invalid latitude (e.g. `> 90`), longitude (e.g. `<= -180`), or structurally broken argument is provided, this error is thrown immediately, bypassing heavy mathematical work.



## Result Pattern

The library uses the following discriminated union for the legacy-safe wrappers:

```ts
type Result<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };
```

Helper constructors:

```ts
function Success<T>(data: T): Result<T>;
function Failure(error: string): Result<never>;
```

Use this pattern when you want to avoid exceptions in application code:

```ts
import { getPrayerTimes } from 'tauqeet-js/prayers';

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

---

## Timezone and Intl Fallbacks

The v1.2-era diagnostics callbacks are exposed through the prayer and solar-alignment formatting helpers. They can be used to observe when the library has to fall back from `Intl` formatting to a simpler UTC/offset-based representation.

### onFallback callback

```ts
function resolveTimeZoneSync(
  explicitTimeZone?: string | number,
  onFallback?: (reason: string) => void
): string | number;
```

```ts
function formatTimeField(
  val: Date | null,
  status: PrayerStatus,
  timeZone: string | number,
  adjustmentMinutes: number,
  onFallback?: (reason: string) => void
): TimeField;
```

Example:

```ts
import { resolveTimeZoneSync } from 'tauqeet-js/prayers';

const tz = resolveTimeZoneSync(undefined, reason => {
  console.warn('Timezone fallback:', reason);
});
```

When `Intl` formatting is unavailable or a timezone name is not recognized, the library reports the fallback reason rather than failing silently.

---

## Error Recovery Table

| Error type | Typical cause | Recommended recovery |
|---|---|---|
| `InvalidArgumentError` | Invalid coordinates or extreme range boundaries | The core system expects inputs to be within safe geographic boundaries before calculating |

---

## Best Practices

- Prefer `calculatePrayerTimes()` for direct, synchronous use when you want exceptions.
- Use `getPrayerTimes()` when you want a stable `Result` object for UI or API layers.
- Attach fallback diagnostics when your app relies on timezone names that may differ by environment.
- Keep input validation close to the caller so configuration issues are surfaced early.
