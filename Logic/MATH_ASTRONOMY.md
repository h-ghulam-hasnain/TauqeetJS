# Astronomical Logic & Solar Ephemeris

The `tauqeet-js/prayers` engine is powered by an extremely precise solar tracking model. Unlike typical consumer libraries that rely on simplified angular approximations, TauqeetJS implements a complete astronomical kernel.

---

## 1. Solar Ephemeris (VSOP87)

The core positional engine relies on a streamlined implementation of the **VSOP87** (Variations Séculaires des Orbites Planétaires) planetary theory. 

### Why VSOP87?
Standard libraries use Jean Meeus's simplified algorithms, which can lose accuracy over long timelines or under rigorous scrutiny. VSOP87 models the actual orbital perturbations (the gravitational pull of Jupiter, Venus, etc., on Earth). 
- The engine uses packed `Float64Array` tables caching hundreds of periodic terms.
- It computes the heliocentric longitude, latitude, and radius vector of the Earth.
- It translates these into geocentric solar coordinates.

**Performance Note:** By vectorizing these terms and packing them into typed arrays, the engine calculates VSOP87 positions in fractional milliseconds, achieving enterprise-grade accuracy without the traditional CPU overhead.

---

## 2. Nutation and Obliquity (IAU2000B)

To correct the Earth's positional wobble, TauqeetJS implements the IAU2000B nutation series.
- **Nutation in Longitude ($\Delta\psi$)**
- **Nutation in Obliquity ($\Delta\epsilon$)**

### Single-Pass Kahan Summation
Because the nutation series involves summing dozens of extremely small floating-point terms (sine and cosine waves), standard accumulation suffers from catastrophic cancellation (loss of precision). TauqeetJS uses a zero-allocation, single-pass **Kahan Summation Algorithm** to retain exact IEEE-754 precision throughout the wobble corrections.

---

## 3. Atmospheric Refraction Modeling

Light bends as it enters the Earth's atmosphere, which means the sun is visible *before* it geometrically crosses the horizon at Sunrise, and *after* it crosses at Sunset.

TauqeetJS computes dynamic atmospheric refraction based on:
1. **Geometric Altitude:** Factoring in the observer's elevation above sea level.
2. **Temperature (Celsius):** Colder air is denser and refracts light more aggressively.
3. **Barometric Pressure (Millibars):** Higher pressure also increases density and refraction.

By providing real-time temperature and pressure to the `PrayerConfig`, the engine dynamically alters the Sunrise/Sunset horizon boundary, resulting in pinpoint accuracy.

---

## 4. Root-Finding (Event Discovery)

Prayer times (other than Dhuhr transit) are defined by the sun reaching specific altitude angles (e.g., -18° for Fajr).
- TauqeetJS does not use fixed time-offsets.
- It utilizes iterative root-finding (similar to the Newton-Raphson or Brent's method) against the VSOP87 curve.
- It narrows down the exact second the solar declination intersects the target horizon angle.
- The engine automatically caps iterations to prevent infinite loops, throwing an `OperationAbortedError` or resolving to a high-latitude fallback if the sun never reaches the target angle.
