# Changelog

All notable changes to `tauqeet-js` will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Sub-path exports (`/prayers`, `/qibla`, `/moon`, `/hijri`, `/solar-alignment`) for true per-module tree-shaking.
- ESLint + Prettier configuration for consistent code quality enforcement.
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) running tests and build on Node 20 and 22.
- `CHANGELOG.md` (this file).

### Changed
- `tsconfig.json`: enabled `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noImplicitOverride`.
- `tsconfig.json`: removed unused `"jsx": "react-jsx"` option (library has no JSX).
- `vitest.config.ts`: broadened `include` from an allowlist to `tests/**/*.test.ts`.

### Fixed
- Stale test files (`engine.test.ts`, `moon.test.ts`, `high-latitude.test.ts`, `extended/*.test.ts`) rewritten to use the current API.
- Removed leftover `methods.ts` from the project root.

---

## [1.1.0] — 2026-06-14

### Added
- **Hijri Calendar module** (`src/hijri/`): Gregorian ↔ Hijri conversion via four strategies — Civil (tabular), Conjunction (astronomical), Visibility (location-based), and Umm al-Qura.
- `HijriEngine` class with pluggable calendar methods.
- Convenience converters `toHijri()` and `toGregorian()`.
- `HIJRI_MONTH_NAMES` constant array.
- **Solar Alignment module** (`src/solar-alignment/`): computes times when the sun aligns with the Qibla direction, useful for compass calibration.
- `EphemerisService` singleton with LRU cache (10-day window) and Lagrange 3-point interpolation for solar ephemeris, reducing per-prayer computation cost.
- `withMetadata` option on `calculatePrayerTimes` / `getPrayerTimes` to expose DEC, EOT, HP, SD, and solver iteration counts per prayer.
- `dhahwaKubra` (Ḍuḥā Kubrā) time to prayer results — the midpoint between Fajr and Sunset.
- Atmospheric corrections (`temperatureC`, `pressureMbar`) for refraction-accurate Sunrise/Maghrib.
- `resolveTimezoneAsync` hook on `PrayerConfig` for async timezone resolution.
- `highLatitudeStrategy` option: `'AngleBased'`, `'MiddleOfNight'`, `'SeventhOfNight'`, `'NearestLatitude'`.

### Changed
- **Architecture consolidation**: merged `internal` and `_internal` utility folders into a single `src/internal/` directory.
- Iterative refinement for Solar Declination and Equation of Time inside the solar alignment solver.
- Validator (`validatePrayerConfig`) now supports DMS string and object coordinate formats.
- `timeZone` falls back to `Intl.DateTimeFormat().resolvedOptions().timeZone` when omitted.
- Default madhab changed to `Hanafi`; default method per madhab derived from `isDefault` flag in registry.

### Fixed
- Sub-second inaccuracies in astronomical event times resolved by iterative ephemeris refinement.
- Pressure validation now enforces integer check (`Number.isInteger`).
- Timezone offset widening (`string | number`) corrected throughout all modules.

---

## [1.0.0] — 2026-05-29

### Added
- **Prayer Times module** (`src/prayers/`): Fajr, Sunrise, Ḍuḥā, Dhuhr, Asr, Maghrib, Isha.
  - 8 built-in calculation methods scoped per Madhab (Hanafi, Shafi, Maliki, Hanbali, Jaafari).
  - High-latitude handling: Polar Day, Polar Night, Continuous Twilight with Astronomical Midnight fallback.
  - Per-prayer minute adjustments via `adjustments` config.
  - Elevation-based horizon dip correction.
- **Qibla module** (`src/qibla/`): great-circle bearing, rhumb-line bearing, and Haversine distance to the Kaaba.
- **Moon module** (`src/moon/`):
  - Moon phase, elongation, illuminated fraction.
  - Moon age (days since last New Moon).
  - Lunar events: Next/Previous New Moon and Full Moon.
  - Crescent visibility via Odeh, Yallop, and HMNAO criteria.
- **Astronomy engine** (`src/astronomy/`): VSOP87-derived solar ephemeris, lunar position theory, ΔT correction (ELP2000-style).
- Dual-module output (ESM + CJS) via `tsup`.
- TypeScript declaration files (`.d.ts` / `.d.cts`).
- Source maps.
- `sideEffects: false` for bundler tree-shaking.
- `prepublishOnly` script to gate `npm publish` behind a full build + test run.
- Comprehensive test suite with `vitest`.

---

[Unreleased]: https://github.com/h-ghulam-hasnain/tauqeet-js/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/h-ghulam-hasnain/tauqeet-js/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/h-ghulam-hasnain/tauqeet-js/releases/tag/v1.0.0
