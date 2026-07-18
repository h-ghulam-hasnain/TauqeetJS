# Qibla Core Math Logic

Currently, in `tauqeet-js`, we utilize core mathematical formulas to compute Qibla-related metrics. These formulas form the foundation of our `qibla` engine and rely strictly on spherical geometry applied to the Earth's surface. 

## How many formulas do we use?
We use exactly **3 core mathematical formulas** within our internal math module (`src/internal/math.ts`) to calculate the distance and direction to the Kaaba (Mecca).

## 1. Haversine Formula (Great-Circle Distance)
**Usage:** `haversineDistance(lat1, lon1, lat2, lon2, radiusKm)`
**Purpose:** Calculates the shortest distance over the Earth's surface between the observer's location and the Kaaba. 
**How it works:**
The Haversine formula determines the great-circle distance between two points on a sphere given their longitudes and latitudes. It is especially robust against floating-point errors for small distances.
- It first converts the coordinate differences into radians.
- It computes the intermediate value `a` representing the square of half the chord length between the points.
- It then calculates the angular distance and multiplies it by the Earth's mean radius (`6371 km`) to output the physical distance in kilometers.

## 2. Spherical Law of Cosines (Great-Circle Bearing)
**Usage:** `sphericalLawOfCosinesBearing(lat1, lon1, lat2, lon2)`
**Purpose:** Calculates the initial true-north bearing of the shortest path (great-circle) from the observer to the Kaaba. This is the primary and most accurate Qibla direction.
**How it works:**
- It computes the difference in longitude (`Δλ`).
- It applies the spherical trigonometry formulas:
  `y = sin(Δλ) * cos(lat2)`
  `x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(Δλ)`
- It uses `Math.atan2(y, x)` to resolve the correct quadrant for the angle.
- The resulting angle is converted from radians to degrees and normalized to a `0..360` range (clockwise from true North).

## 3. Rhumb Line Formula (Loxodromic Bearing)
**Usage:** `rhumbLineBearing(lat1, lon1, lat2, lon2)`
**Purpose:** Calculates the bearing for a constant compass heading to the Kaaba.
**How it works:**
While a great-circle path requires continuously adjusting your heading, a rhumb line path allows you to travel at a single fixed compass angle to reach the destination.
- It uses the Mercator projection principle where lines of constant bearing are straight lines.
- `Δφ` is calculated using logarithmic tangents: `ln(tan(π/4 + lat2/2) / tan(π/4 + lat1/2))`.
- It uses `Math.atan2(Δλ, Δφ)` to find the rhumb line bearing.
- The angle is then converted to degrees and normalized to `0..360`.

---
**Note:** All these mathematical algorithms are utilized by `getQiblaDirection`, `getQiblaAdvanced`, and `getQiblaDistance` methods in `src/qibla/direction/` where Mecca's geographic coordinates (`21.422487° N, 39.826206° E`) are hardcoded as the destination. If the calculated distance to the Kaaba is less than `0.001` km (1 meter), the resulting bearings return `null`.
