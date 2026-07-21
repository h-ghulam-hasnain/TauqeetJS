# Architectural Comparison: TauqeetJS vs Adhan.js

The `tauqeet-js` engine and the `adhan.js` library share the same astronomical target (Islamic Prayer Times), but they execute vastly different computational philosophies.

## The Core Difference

A useful way to think about it is:
- **Adhan.js**: "Solve the event quickly with a robust approximation and a correction step."
- **TauqeetJS**: "Solve the event precisely from a rigorous solar model and refine until the mathematical residual is negligible."

---

## 1. Solar Model & Ephemeris

| Feature | Adhan.js | TauqeetJS |
|---|---|---|
| **Engine Foundation** | Lightweight series-based Meeus approximation. | High-precision VSOP87 planetary theory & IAU2000B nutation. |
| **Equation of Time (EoT)** | Simplified polynomial approximation. | Explicitly derived dynamically per-calculation via solar right ascension. |
| **Atmospheric Refraction** | Static, fixed offset values. | Dynamic; integrates actual Barometric Pressure (mBar) and Temperature (C). |

## 2. Event Resolution (Root Finding)

When determining the exact second the Sun hits the Fajr (-18°) or Maghrib (0.833°) angle:
- **Adhan.js** computes an approximate time offset using fixed math, then optionally applies a one-time linear adjustment.
- **TauqeetJS** uses iterative root-finding algorithms. It guesses the time, calculates the exact solar position at that guess using VSOP87, sees how far off it is from the target angle, and loops (refines) until the difference is mathematically negligible.

## 3. High Latitude Stability

- **Adhan.js** can sometimes output `NaN` or mathematically undefined behavior if the Sun never reaches a target angle (e.g., Midnight Sun).
- **TauqeetJS** anticipates these boundary conditions via root-finding intercepts. If the target angle is mathematically impossible, it intercepts the exception and seamlessly falls back to designated strategies (Middle of Night, Nearest Latitude, etc.), preventing unexpected app crashes.

## 4. Output Surface

- **Adhan.js** is purely synchronous and highly mutable.
- **TauqeetJS** provides both synchronous and asynchronous (dynamic timezone fetching) wrappers, leveraging a rigorous `Result` pattern (Fail-Safe), immutable `validateCoordinates` boundaries, and strictly typed TypeScript definitions.
