# Changelog

All notable changes to tauqeet-js are documented here.

## Unreleased

## 1.1.3 — 2026-07-09

### Added
- Per-module subpath exports for `prayers`, `qibla`, `moon`, `hijri`, and `solar-alignment`.
- Optional fallback diagnostics in timezone and formatting helpers.
- More explicit validation for custom prayer angles and high-latitude configuration.
- New documentation set covering API usage, configuration, errors, performance, and migration guidance.

### Changed
- Prayer-time calculation now reuses transit data more effectively in the hot path.
- Solar-alignment evaluation now reuses cached solar positions for repeated lookups.
- The astronomy kernel uses a single-pass Kahan-style loop for nutation accumulation with lower allocation pressure.
- The public surface is now documented as module-focused and tree-shakeable.

### Fixed
- Duplicate Dhuhr work in the prayer engine was removed.
- Formatting and timezone fallback paths now surface diagnostics instead of silently degrading.
- Unexpected errors in moon-visibility logic are no longer swallowed indiscriminately.

### Performance
- VSOP87 evaluation paths use parallel `Float64Array` tables and unrolled Kahan accumulation.
- Benchmarks from the audit show approximately 15,800 ops/sec, 0.0633 ms average latency, and 33.9 KB gzip bundle size for the optimized path.

### Migration Notes
- No public APIs were removed in 1.1.3.
- Existing code using `calculatePrayerTimes()` and `getPrayerTimes()` continues to work.
- If you want smaller bundles, prefer module subpath imports such as `tauqeet-js/prayers` and `tauqeet-js/moon`.
- If you previously relied on silent fallback behaviour, update your code to handle `Result` failures or catch `PrayerCalculationError` explicitly.

---

## 1.1.0 — 2026-06-14

### Added
- Hijri conversion via Civil, Conjunction, Visibility, and Umm al-Qura methods.
- Solar alignment calculations via `getSunAtQibla()`.
- Additional prayer metadata and high-latitude strategies.

### Changed
- The library now supports async timezone resolution and richer prayer configuration.

---

## 1.0.0 — 2026-05-29

### Added
- Initial public release with prayer times, Qibla, moon calculations, and Hijri conversion.
