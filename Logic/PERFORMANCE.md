# Performance and Astronomical Precision

This document summarises the astronomical models used by tauqeet-js, the latest optimisation work in v1.1.3, and the performance guidance that applies to production integrations.

For the public API, see [API.md](API.md). For error-handling guidance, see [ERROR_HANDLING.md](ERROR_HANDLING.md).

---

## Astronomical Models

### Solar ephemeris: VSOP87

The library uses a VSOP87-derived solar ephemeris for high-precision solar position calculations. This model is widely used in modern astronomical software and provides sub-arcsecond to arcsecond-level precision for the relevant quantities used by prayer calculations.

### Lunar theory: ELP2000-style modelling

The moon module relies on lunar modelling that is consistent with modern ephemeris-based approaches. These calculations feed moon phase, age, and visibility estimates.

### Nutation: IAU models

The internal astronomy layer uses nutation models to account for the irregular motion of Earth’s axis. The current implementation targets the modern IAU-based modelling approach used by the library’s solar and lunar routines.

### ΔT corrections

The library applies ΔT corrections when converting between terrestrial time and universal time. This is important for accurate solar and lunar event calculations.

---

## Why these models are used

These models are used because they provide high-precision astronomical inputs with a manageable runtime cost. The library prioritises correctness for use cases such as prayer timing and moon visibility while keeping the API approachable for application developers.

The main trade-off is that the coefficient tables and iterative computations are not trivial; they are intentionally heavier than simple geometric approximations.

---

## Lazy loading of VSOP87 tables

The package uses lazy loading for the heavy VSOP87 coefficient tables via `getVSOP87Tables()`.

```ts
import { getVSOP87Tables } from 'tauqeet-js/astronomy';

await getVSOP87Tables();
```

This keeps startup overhead lower for applications that do not immediately need astronomy-heavy calculations.

---

## Optimisations in v1.1.3

The audit showed several measurable improvements:

- Parallel `Float64Array` storage for VSOP87 coefficients.
- Unrolled Kahan summation in the hot series evaluation path.
- Reduced allocation pressure in nutation evaluation.
- A per-call cache for repeated solar position lookups in the Qibla-alignment path.

These changes reduce redundant work and improve runtime consistency for repeated calculations.

---

## Benchmarks

The audit reported the following benchmark results for the optimized path:

| Metric | Result |
|---|---:|
| Ops/sec | ~15,800 |
| Average latency | ~0.0633 ms |
| Gzip bundle size | ~33.9 KB |

These figures are indicative and can vary by runtime, CPU, and bundler settings.

---

## Performance Guidance

### Use async workers for heavy batch workloads

For applications that need many astronomical computations in a single page load or batch job, prefer:

- Web Workers in browsers.
- Worker threads in Node.js.
- Background scheduling with `requestIdleCallback` when available.

### Cache repeated results

If the same location and date are queried repeatedly, cache the outcome at the application layer.

### Prefer subpath imports

Import from the specific module you need so bundlers can tree-shake unused code.

```ts
import { calculatePrayerTimes } from 'tauqeet-js/prayers';
```

### Use async prayer calculations when timezone resolution is dynamic

```ts
import { calculatePrayerTimesAsync } from 'tauqeet-js/prayers';

await calculatePrayerTimesAsync({
  lat: 51.5074,
  long: -0.1278,
  resolveTimezoneAsync: async () => 'Europe/London',
});
```
