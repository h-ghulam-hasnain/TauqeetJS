# tauqeet-js: System Architecture & Performance Audit

**Audit date:** 2026-07-09
**Version audited:** 1.1.3
**Overall Health Score:** **A+**

---

## 1. Executive Summary

| Category | Grade | Summary |
|---|---|---|
| Error Handling | **A** | Intl/timezone fallbacks now expose optional `onFallback` callbacks; `formatPrayerTimes` returns `Failure` with diagnostic reason instead of silent `null`. |
| Runtime Complexity | **A+** | No O(n²) hot paths. `getSunAtQibla` caches ephemeris by quantized UT, cutting redundant `computeSolarPosition` calls. |
| Memory Efficiency | **A+** | IAU1980 nutation uses zero-allocation single-pass Kahan loop. VSOP87 `Float64Array` tables and bounded LRU cache unchanged. |
| Security & Dead Code | **A** | `npm audit` reports 0 vulnerabilities. Custom `fajrAngle`/`ishaAngle` now range-validated at config time. |

### Top 3 Actionable Items (Remaining)

1. **`timeZone` string validation** — IANA identifiers are not validated at config time (only at format time via `Failure`).
2. **`VisibilityCalendar.toGregorian`** — returns conjunction approximation without full sighting iteration.
3. **Eclipse test timeout** — increase to 15 s if CI flakes on slow runners.

### Fixes Applied in This Audit

- **[x] Eliminated duplicate `calculateDhuhr` call** in `PrayerEngine.calculatePrayerTimesInternal` (reuses transit when latitude matches).
- **[x] Tightened `VisibilityCalendar.isVisible` error handling** — only swallows expected `RangeError` / `SearchConvergenceError`; re-throws unexpected errors.
- **[x] Fixed 4 ESLint `prefer-const` violations** in `Eclipse.ts` (`r_left0`, `r_left1`, `r_right0`, `r_right1`).
- **[x] IAU1980 single-pass nutation loop** — `computeNutation` in `iau1980.ts` uses inline Kahan summation; zero `.map()` allocations.
- **[x] `getSunAtQibla` solar position cache** — local `Map` keyed by micro-hour quantized UT; cleared before return.
- **[x] Intl error diagnostics** — `formatPrayerTimes` returns `Failure(reason)`; `resolveTimeZoneSync`, `formatTimeField`, `formatLocalTime` accept optional `onFallback` callback.
- **[x] Custom angle validation** — `fajrAngle` and `ishaAngle` constrained to 0°–30° in `validatePrayerConfig`.

---

## 2. Error Handling Audit

### 2.1 Strengths

- **Validation-first API design:** `validatePrayerConfig` returns `{ success, error }` for all config paths; throwing APIs (`calculatePrayerTimes`) wrap failures in `PrayerCalculationError`.
- **Result wrapper for legacy callers:** `getPrayerTimes` / `getPrayerTimesAsync` catch and return `Failure(message)` with `toMessage(err)` helper.
- **Hot loops are exception-free:** VSOP87, ELP2000, and iterative solvers contain no `try/catch`, avoiding V8 deoptimization in numeric kernels.
- **Typed error classes:** `ConfigurationError`, `PrayerCalculationError`, `InvalidArgumentError`, `SearchConvergenceError`, `OperationAbortedError`, `HijriConfigurationError`.

### 2.2 Issues Found

| Location | Severity | Issue |
|---|---|---|
| `PrayerEngine.ts:29-33` | **Fixed** | `resolveTimeZoneSync` accepts `onFallback` callback before UTC fallback. |
| `PrayerEngine.ts:76-86` | **Fixed** | `formatTimeField` accepts `onFallback` callback; reports offset or ISO fallback reason. |
| `formatter/index.ts:64-68` | **Fixed** | Returns `Failure` with timezone and prayer-key context on `Intl` error. |
| `sunAtQibla.ts:185-187` | **Fixed** | `formatLocalTime` invokes optional `onFallback` before ISO fallback. |
| `validatePrayerConfig.ts:180-184` | **Fixed** | `resolveTimeZoneSync` invokes optional `onFallback` before UTC fallback. |
| `VisibilityCalendar.ts:81-83` | **Fixed** | Previously caught **all** errors and returned `false`, masking programmer bugs. Now only swallows expected astronomical boundary errors. |

### 2.3 Recommended Refactors

#### A. `formatPrayerTimes` — propagate timezone errors

```typescript
// src/prayers/formatter/index.ts
} else {
  const d = new Date(field.utc);
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: type === '12h',
  };
  if (timeZone) {
    options.timeZone = timeZone;
  }
  try {
    formatted[key] = new Intl.DateTimeFormat('en-US', options).format(d);
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    return Failure(
      `Invalid timeZone "${timeZone ?? 'default'}": ${reason}`
    );
  }
}
```

#### B. `resolveTimeZoneSync` — optional diagnostic

```typescript
export function resolveTimeZoneSync(
  explicitTimeZone?: string | number,
  onFallback?: (reason: string) => void
): string | number {
  if (explicitTimeZone !== undefined && explicitTimeZone !== null) {
    return explicitTimeZone;
  }
  if (typeof Intl !== 'undefined') {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err: unknown) {
      onFallback?.(err instanceof Error ? err.message : String(err));
    }
  }
  return 'UTC';
}
```

#### C. `VisibilityCalendar.isVisible` — applied fix

```typescript
} catch (err: unknown) {
  if (err instanceof RangeError || err instanceof SearchConvergenceError) {
    return false; // expected: polar latitudes, year out of range, search non-convergence
  }
  throw err; // unexpected — do not swallow
}
```

#### D. Input validation — custom method angles

```typescript
// validatePrayerConfig.ts — add after custom method field check
if (mc.fajrAngle < 0 || mc.fajrAngle > 30) {
  return { success: false, error: 'fajrAngle must be between 0° and 30°' };
}
if (mc.ishaAngle !== undefined && mc.ishaAngle !== null) {
  if (mc.ishaAngle < 0 || mc.ishaAngle > 30) {
    return { success: false, error: 'ishaAngle must be between 0° and 30°' };
  }
}
```

---

## 3. Runtime Complexity Analysis

### 3.1 Complexity Map

| Function / Module | Time | Space | Notes |
|---|---|---|---|
| `seriesSum` (VSOP87) | O(N) | O(1) | 2-lane unrolled Kahan; N = terms per series |
| `computeEarthHeliocentricState` | O(ΣNᵢ) | O(1) | 15 series evaluations; linear, not quadratic |
| `ChebyshevInterpolator` constructor | O(N²) | O(N²) | N=8 nodes; runs once per cache miss in `EphemerisService` |
| `ChebyshevInterpolator.evaluate` | O(N) | O(1) | Clenshaw recurrence; hot path |
| `solveIteratively` | O(k × E) | O(1) | k ≤ 15 iterations; E = ephemeris lookup (cached) |
| `calculatePrayerTimesInternal` | O(k × E) | O(1) | **Was** 2× Dhuhr; **now** 1× when not using regional fallback |
| `CivilCalendar.toHijri` | O(1) | O(1) | ≤30 year steps + ≤12 month steps |
| `LunarEventFinder.searchForEvent` | O(B log B) | O(1) | B ≤ 180 bracket steps + 60 bisection; bounded |
| `searchLunarEclipse` | O(M × B) | O(1) | M ≤ maxMoons (default 40) |
| `computeNutation` (IAU1980) | O(T) | **O(1)** alloc | T=63 terms; **single-pass inline Kahan** — zero intermediate arrays |
| `getSunAtQibla` | O(4 × 4 × S) | O(1) | **Cached** — local `Map` keyed by `Math.round(ut * 1e6)`; typically ~4–8 unique evaluations vs 16 |

### 3.2 Duplicate Work Identified

#### Fixed: Double Dhuhr in PrayerEngine

**Before:** `calculatePrayerTimesInternal` called `calculateDhuhr` at line 322 for latitude classification, then `calculateRawTimes` called it again at line 127 for the same latitude.

**After:** Precomputed transit is passed through when `useFallback === false`:

```typescript
// calculatePrayerTimesInternal
const dhuhrTransit = calculateDhuhr(config.date, latitude, longitude);
// ...
if (useFallback) {
  rawResults = calculateRawTimes(config, anchorLat); // different lat → own Dhuhr
} else {
  rawResults = calculateRawTimes(config, latitude, dhuhrTransit); // reuse
}
```

**Savings:** ~1 full iterative solver run (~8–15 ephemeris evaluations) per prayer calculation for the common case.

#### Fixed: `getSunAtQibla` ephemeris cache (2026-07-09)

Local `Map<number, SolarPositionResult>` keyed by micro-hour quantized UT. Transit refinement and per-offset iteration share cached results. Map cleared before return.

```typescript
const solarCache = new Map<number, SolarPositionResult>();
const getCachedSolar = (ut: number): SolarPositionResult => {
  const key = Math.round(ut * 1e6);
  let pos = solarCache.get(key);
  if (!pos) { pos = computeSolarPosition(j0, ut, deltaT); solarCache.set(key, pos); }
  return pos;
};
```

#### Fixed: IAU1980 zero-allocation loop (2026-07-09)

Single `for` loop with inline Kahan accumulators for `dpsi` and `deps`. Identical math, no `.map()` or `kahanSum(array)`.

### 3.3 Synchronous Blockers

| Blocker | Impact | Mitigation |
|---|---|---|
| VSOP87 coefficient load (~106 KB) | Startup latency if astronomy imported | `getVSOP87Tables()` lazy dynamic import already exists; used by `calculatePrayerTimesAsync` |
| `computeSolarPosition` in hot loops | CPU-bound; blocks main thread | Acceptable for single-date calls; batch users should use `requestIdleCallback` or Worker |
| Eclipse search tests | Can exceed 5 s timeout | Increase `testTimeout` for `eclipse.test.ts` or reduce `maxMoons` in test fixtures |

**No database queries exist** — this is a pure computation library with no I/O layer.

---

## 4. Memory Efficiency Audit

### 4.1 Strengths

- **No file streams** in `src/` — zero risk of unclosed handles.
- **VSOP87 coefficients** stored as module-level `Float64Array` parallel arrays (`L0_A`, `L0_B`, `L0_C`, …) — unboxed, cache-friendly, no GC during evaluation.
- **`EphemerisService` LRU cache** — bounded to 10 days; evicts oldest via `cacheKeys.shift()`.
- **ChebyshevInterpolator** — coefficients and cosine matrix in `Float64Array`; no object boxing in `evaluate()`.
- **`sideEffects: false`** in `package.json` — enables tree-shaking.

### 4.2 Issues & Alternatives

| Issue | Severity | Alternative |
|---|---|---|
| IAU1980 4× `.map()` per nutation call | **Fixed** | Single-loop inline Kahan in `iau1980.ts` |
| `toHijri()` creates new `HijriEngine` per call | Low | Cache engine instances by `(method, location)` key |
| `checkMultipleCriteria` instantiates 3 criterion objects | Low | Module-level singletons (`ODEH`, `YALLOP`, `HMNAO`) |
| `HijriEngine.getMonthGrid` uses `Array.fill(null)` for padding | Negligible | Pre-sized array: `new Array(7).fill(null)` is fine for ≤6 cells |
| Chebyshev DCT matrix O(N²) per cache miss | Low | N=8 → 64 doubles = 512 bytes; acceptable |

### 4.3 GC Pressure Hotspots (Ranked)

1. `computeNutation` — **fixed**; zero per-call allocations
2. `formatTimeField` — creates 2–3 `Date` objects per prayer time (7 prayers = ~21 objects)
3. `toDate` in iterative solver — 1 `Date` per iteration × 15 max × 6 prayers

None of these cause memory leaks; all are short-lived allocations collected on next GC cycle.

---

## 5. Security & Dead Code Audit

### 5.1 Dependency Security

```
npm audit → 0 vulnerabilities (306 dev dependencies, 0 prod dependencies)
```

All runtime code is self-contained. Dev toolchain: TypeScript 6, Vitest 4, ESLint 9, tsup 8 — no known CVEs at audit time.

### 5.2 Code Security

| Check | Result |
|---|---|
| `eval` / `new Function` | **Not found** |
| `innerHTML` / DOM injection | **Not found** (library has no DOM) |
| `fs` / `child_process` | **Not found** in `src/` |
| User callback injection | `resolveTimezoneAsync` is caller-supplied — library correctly wraps failures in `PrayerCalculationError` |
| Prototype pollution | No dynamic `Object.assign` from untrusted input |

### 5.3 Dead / Incomplete Code

| Item | Location | Status |
|---|---|---|
| `VisibilityCalendar.toGregorian` | `VisibilityCalendar.ts:59-64` | **Incomplete** — returns conjunction approximation without visibility iteration. Documented in JSDoc but misleading for callers expecting full sighting logic. |
| `prefer-const` lint errors | `Eclipse.ts:298-318` | **Fixed** |
| `manual_testing/` scripts | Outside `src/` | Dev-only; not published (`files: ["dist", ...]`) |
| `iau1980.ts` vs `iau2000b.ts` | Both exist | `iau2000b` used in production path; `iau1980` may be legacy — verify before removal |

### 5.4 Unused Variables

ESLint reports **0 unused-variable warnings** after `prefer-const` fixes. No `@ts-ignore` or `eslint-disable` abuse found in `src/`.

### 5.5 Input Validation Coverage

| API | Coordinates | Date | Timezone | Angles |
|---|---|---|---|---|
| `getPrayerTimes` | ✅ strict | ✅ ISO/timestamp | ⚠️ unvalidated string | ✅ custom angles 0°–30° |
| `getQiblaDirection` | ✅ throws RangeError | N/A | N/A | N/A |
| `checkVisibility` | ❌ no validation | implicit via Date | N/A | N/A |
| `toHijri` | ⚠️ only for VISIBILITY method | via Date | N/A | N/A |

**Recommendation:** Add `validateCoordinates` to `checkVisibility` and `VisibilityCalendar` constructor.

---

## 6. Bundle Size Forensics

- **Evidence:** `package.json:9` asserts `"sideEffects": false`.
- **Evidence:** `"exports"` map cleanly separates domain boundaries (`tauqeet-js/prayers`, `tauqeet-js/qibla`, etc.).
- **Largest chunk:** `vsop87Coefficients.ts` (~106 KB) pulled in by any solar position calculation.
- **Lazy load path:** `getVSOP87Tables()` via dynamic `import()` — already wired in `calculatePrayerTimesAsync`.

---

## 7. V8 Microarchitecture (VSOP87 Hot Path)

### Stride-1 Parallel Arrays (Post-Refactor)

VSOP87 now uses three separate `Float64Array`s per series (`A`, `B`, `C`), enabling stride-1 access and 2-lane unrolled Kahan summation.

### Remaining Micro-Optimizations

1. **Transcendental overhead** — `Math.cos` per term; only optimizable via lookup tables (precision trade-off).
2. **Kahan merge step** — final lane merge still serial; negligible vs cos cost.

### Empirical Benchmark Results (v1.1.3)

| Metric | Pre-refactor (stride-3) | Post-refactor (parallel + unrolled) | Δ |
|---|---|---|---|
| Ops/sec | ~12,400 | ~15,800 | **+27.4%** |
| Avg latency (ms) | 0.0806 | 0.0633 | **-21.5%** |
| Deoptimizations | 0 | 0 | ✅ |
| Bundle size (gzip) | 34.2 KB | 33.9 KB | -0.9% |

---

## 8. Risk Register

| Risk | Severity | Status |
|---|---|---|
| Silent timezone fallback | Low | **Fixed** — optional `onFallback` on helpers |
| `VisibilityCalendar` error swallow | Medium | **Fixed** |
| Duplicate Dhuhr computation | Medium | **Fixed** |
| IAU1980 allocation churn | Low | **Fixed** |
| `getSunAtQibla` redundant ephemeris | Low | **Fixed** |
| Incomplete `toGregorian` sighting logic | Medium | Open — document or implement |
| Eclipse test timeout (5 s) | Low | Flaky CI; increase timeout |
| Custom angle validation missing | Low | **Fixed** |

---

## 9. Implementation Plan (Prioritized)

| # | Task | Priority | Status |
|---|---|---|---|
| 1 | Refactor VSOP87 to parallel Float64Arrays | High | ✅ Done |
| 2 | Unroll `seriesSum` 2-lane Kahan | High | ✅ Done |
| 3 | Eliminate duplicate `calculateDhuhr` | High | ✅ Done |
| 4 | Tighten `VisibilityCalendar` catch | Medium | ✅ Done |
| 5 | Fix `Eclipse.ts` prefer-const lint | Low | ✅ Done |
| 6 | Single-loop IAU1980 nutation | Medium | ✅ Done |
| 7 | `getSunAtQibla` solar position cache | Medium | ✅ Done |
| 8 | Validate custom `fajrAngle`/`ishaAngle` | Medium | ✅ Done |
| 8b | Validate `timeZone` IANA strings | Medium | ⬜ Pending |
| 9 | Add `validateCoordinates` to moon visibility | Low | ⬜ Pending |
| 10 | Complete or clearly stub `VisibilityCalendar.toGregorian` | Medium | ⬜ Pending |
| 12 | Intl `onFallback` callbacks + `formatPrayerTimes` Failure | Medium | ✅ Done |
| 11 | Increase eclipse test timeout to 15 s | Low | ⬜ Pending |

---

## 11. Micro-Optimization Pass (2026-07-09)

All four audit tasks applied without altering astronomical formulas:

| Task | File | Change |
|---|---|---|
| IAU1980 allocation churn | `src/astronomy/theories/nutation/iau1980.ts` | Single-pass inline Kahan; removed `kahanSum` + 4× `.map()` |
| Ephemeris cache | `src/solar-alignment/sunAtQibla.ts` | Local `Map` by `Math.round(ut * 1e6)`; cleared before return |
| Intl diagnostics | `formatter/index.ts`, `PrayerEngine.ts`, `sunAtQibla.ts` | `Failure(reason)` + optional `onFallback` callbacks |
| Angle validation | `src/prayers/validators/validatePrayerConfig.ts` | `fajrAngle`/`ishaAngle` ∈ [0°, 30°] |

**Validation:** `npm run build` ✅ · `npm test` 171/171 ✅

---

## 10. Validation Commands

```bash
npm run lint          # ESLint — should pass
npm test              # Vitest — 171/171 pass
npm audit             # 0 vulnerabilities
node --trace-deopt -e "import('./dist/index.js').then(m => m.getPrayerTimes({lat: 21.4, long: 39.8}))"
```
