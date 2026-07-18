# Geodesic & Spherical Trigonometry Audit: Qibla Decision Pipeline vs. Standard Geodetic Models

**Author:** Elite Geospatial Software Architect
**Date:** July 2026
**Subject:** Rigorous mathematical audit of the `qibla_decision_pipeline_english.ts` (10-rule heuristic pipeline) compared against standard computational geodesy algorithms (Karney, Vincenty, and Geodesy-i4d Loxodromes).

---

## 1. Executive Summary

This document presents a first-principles mathematical and structural analysis of the current Qibla determination logic compared to industry-standard geodetic solutions. The current pipeline implements the **Fatawa-e-Razvia (Imam Ahmad Raza) 10-rule heuristic**, which is a discrete, branch-based evaluation of spherical trigonometry.

While ellipsoidal models (like Vincenty and Karney) offer superior sub-millimeter geospatial precision by accounting for the Earth's flattening ($f = 1/298.257223563$), they introduce immense computational overhead and dangerous convergence pitfalls. Conversely, loxodromic models (Rhumb lines) preserve constant heading but fail to provide the orthodromic (great-circle) shortest path required by Islamic jurisprudence.

---

## 2. Mathematical Comparison Table

| Feature / Algorithm | Current Qibla Pipeline (Fatawa-e-Razvia) | GeographicLib (Karney) | Vincenty's Formulae | Geodesy-i4d (Rhumb/Loxodrome) |
| :--- | :--- | :--- | :--- | :--- |
| **Earth Model** | Spherical | Ellipsoidal (WGS84) | Ellipsoidal (WGS84) | Spherical (Mercator) |
| **Path Geometry** | Orthodromic (Great-Circle) | Orthodromic (Geodesic) | Orthodromic (Geodesic) | Loxodromic (Constant Bearing) |
| **Time Complexity** | $\mathcal{O}(1)$ (Discrete Algebraic) | $\mathcal{O}(N)$ (Integrals/Newton's) | $\mathcal{O}(N)$ (Iterative loops) | $\mathcal{O}(1)$ (Analytic) |
| **Antipodal Stability**| **Absolute** (Explicit `if` rule) | **Absolute** (Guaranteed limit) | **Fails** (Infinite loop / NaN) | **Fails** (Undefined heading) |
| **Poles Handling** | Handled via Vertex limits | Handled natively | Unstable limits | Singularity at $90^\circ$ |
| **Accuracy (Max Error)**| $\approx 0.2^\circ$ (Due to $f=0$) | $15$ nanometers | $0.5$ millimeters | N/A (Wrong geometric path) |
| **Liturgical Validity** | **High** (Traditional Spherical) | **Highest** (Exact physical path)| **Highest** (Except Antipodes)| **Invalid** (Not shortest path) |

---

## 3. Pitfalls & Edge Cases

### A. The Vincenty Antipodal Failure
Vincenty's inverse algorithm utilizes an iterative relaxation method to solve the geodesic on an oblate spheroid. The core mathematical pitfall is its reliance on $\sin(\alpha)$ and $\sigma$ converging. As the distance between two points approaches half the circumference of the Earth (e.g., exact opposite sides of the globe), the variable $\lambda$ oscillates. The iterative loop `while (abs(lambda - lambda_prime) > 1e-12)` fails to converge, throwing an exception or hanging the runtime. 
*By contrast, the Qibla pipeline isolates the antipode explicitly (Rule 1) making it completely immune to this geodetic failure.*

### B. Loxodromic (Rhumb Line) Liturgical Deprecation
A Rhumb line (implemented in `geodesy-i4d`) dictates a path of constant bearing. While useful for ancient nautical compass navigation, it creates a spiral (loxodrome) towards the poles on a sphere.
For Qibla, Islamic consensus dictates the "shortest physical distance" (Great-Circle / Orthodrome). If a user in New York faces Makkah via a Rhumb line, they will be facing a wildly different direction (often deviating by $>15^\circ$) compared to the Great-Circle path. Rhumb lines are scientifically and liturgically deprecated for determining the Qibla.

### C. Spherical vs. Ellipsoidal Drift
The Qibla Decision pipeline assumes a perfectly spherical Earth. However, the WGS84 ellipsoid has a flattening $f \approx 1/298.25$. This flattening means that a purely spherical great-circle bearing will deviate from an exact ellipsoidal geodesic (Karney) by a maximum of roughly $0.1^\circ$ to $0.2^\circ$ depending on the latitude and longitude transversed. While liturgically acceptable (visual alignment of the human body has a margin of error of $\pm 2^\circ$), if GPS-level sub-millimeter structural alignment is required for building a mosque, Karney's algorithm must be used.

---

## 4. Concrete Suggestions to Optimize the Current Pipeline

The `qibla_decision_pipeline_english.ts` file implements a brilliant, singularity-free heuristic approach. However, it suffers from several inefficient micro-operations that add unnecessary CPU cycles. As a Senior Software Architect, I mandate the following refactoring to achieve true high-performance $\mathcal{O}(1)$ execution:

### 1. Pre-Compute Static Makkah Constants
**Issue:** Makkah's coordinates are immutable, yet Rules 4, 5, 6, and 8 repeatedly calculate `Math.tan(degToRad(phi_M))` and `Math.sin(degToRad(phi_M))` at runtime.
**Solution:** Hoist these out of the calculation path into top-level constants evaluated once at module load.
```typescript
const MAKKAH_LAT_RAD = degToRad(21.422487);
const TAN_PHI_M = Math.tan(MAKKAH_LAT_RAD);
const SIN_PHI_M = Math.sin(MAKKAH_LAT_RAD);
```
*Replace all `1 / Math.tan(...)` calculations with `1 / TAN_PHI_M`.*

### 2. Eliminate Expensive Division in Radian Conversions
**Issue:** `degToRad` and `radToDeg` are invoked constantly, utilizing floating-point division `(deg * Math.PI) / 180`. Division is heavily penalized in the V8 CPU pipeline compared to multiplication.
**Solution:** Pre-calculate the multiplication scalar.
```typescript
const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;
const degToRad = (deg: number): number => deg * DEG2RAD;
const radToDeg = (rad: number): number => rad * RAD2DEG;
```

### 3. Replace Dangerous `while` Loops with `O(1)` Modulo Arithmetic
**Issue:** Normalization logic (Step 1 and Step 3) uses while loops.
```typescript
while (bearing >= 360) bearing -= 360;
while (bearing < 0) bearing += 360;
```
If dirty coordinates (`bearing = 1000000`) are ingested, this loop blocks the event loop for thousands of ticks.
**Solution:** Use constant-time floating-point modulo arithmetic.
```typescript
// Normalize bearing strictly to [0, 360)
bearing = (bearing % 360.0 + 360.0) % 360.0;

// Normalize longitude delta to [-180, 180)
dLng = ((dLng + 180.0) % 360.0 + 360.0) % 360.0 - 180.0;
```

### 4. Standardize Floating-Point Tolerance (Epsilon)
**Issue:** The heuristic rules evaluate strict equality for floating point values (`phi === 0`) and use a hardcoded magic number `1e-4` in Rule 7 and Rule 8 (`Math.abs(phi - phi_v) < 1e-4`). Strict equality (`===`) on IEEE-754 floats is a classic architectural anti-pattern due to precision loss.
**Solution:** Define a global rigorous EPSILON and use it for all boundary condition checks.
```typescript
const EPSILON = 1e-9;

// Instead of phi === 0
if (Math.abs(phi) < EPSILON) { ... }

// Apply epsilon cleanly
if (Math.abs(phi - phi_v) < EPSILON) { ... }
```

### Summary of Action
By implementing the mathematical refactors above, `qibla_decision_pipeline_english.ts` will achieve a flawless $\mathcal{O}(1)$ execution graph, making it mathematically stable at antipodal singularities, entirely loop-free, and CPU-optimized for high-throughput coordinate processing.
