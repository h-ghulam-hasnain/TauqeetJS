# Limitations & Mathematical Boundaries

While `tauqeet-js` provides enterprise-grade precision, its astronomical models are governed by specific mathematical limitations. Integrators must be aware of these bounds.

## 1. VSOP87 Temporal Validity

The VSOP87 (Variations Séculaires des Orbites Planétaires) planetary theory provides sub-arcsecond accuracy, but this accuracy decays over extreme time scales.
- **Optimal Range:** 2000 BCE to 6000 CE.
- Calculations run outside of this +/- 4,000 year window will experience degrading precision. For standard prayer time applications, this limitation is mathematically irrelevant, but it should be noted for historical astronomical simulations.

## 2. Refraction Limits

The atmospheric refraction models are built for standard tropospheric conditions.
- Extremely high elevations (e.g., commercial flight altitudes > 30,000 ft) drastically alter standard refraction profiles.
- Extreme localized atmospheric phenomena (e.g., intense temperature inversions, polar mirages) cannot be modeled predictively and may cause observed twilight to differ from calculated twilight by up to a minute.

## 3. High Latitude Edge Cases

In regions above 66.5° N/S (Polar Zones), the sun does not geometrically rise or set for weeks at a time.
- The engine accurately detects this mathematical state (returning `POLAR_DAY` or `POLAR_NIGHT`).
- However, because true twilight does not exist, the engine *must* rely on artificial fallback rules (e.g., `NearestLatitude`). The resulting times are legal/jurisprudential approximations, not astronomical realities.

## 4. Lunar / Hijri (Deprecated)

As of `v2.0.0`, all Lunar Visibility, Phase, Eclipse, and Hijri Calendar approximations have been permanently removed. The engine focuses exclusively on solar phenomena. Integrators requiring lunar data should utilize dedicated lunar ephemeris libraries.
