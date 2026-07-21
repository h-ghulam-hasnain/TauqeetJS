# Qibla Mathematics & Spherical Geometry

The `tauqeet-js/qibla` module utilizes fundamental spherical trigonometry to accurately resolve the bearing and distance from any global coordinate to the Kaaba in Mecca. Due to the curvature of the Earth, standard 2D cartesian formulas are insufficient; thus, the engine implements rigorous 3D spherical projections.

## The Kaaba Reference Point

All calculations in the Qibla engine use the exact geodesic coordinates of the Kaaba:
- **Latitude:** `21.4225° N`
- **Longitude:** `39.8262° E`

The engine uses a mean Earth radius of `6371 kilometers` for all distance projections.

---

## 1. Great-Circle Distance (Haversine Formula)

The Haversine formula determines the shortest distance over the Earth's surface between two geographic points. Unlike the Spherical Law of Cosines, Haversine remains numerically stable even for small distances (avoiding floating-point truncation on extremely close coordinates).

### Algorithm
1. Convert the differences in latitude and longitude into radians.
2. Calculate the square of half the chord length between the points.
3. Compute the angular distance in radians.
4. Multiply by the Earth's mean radius to determine the distance in kilometers.

**Time Complexity:** `O(1)`  
**Space Complexity:** `O(1)`

---

## 2. Great-Circle Bearing (Spherical Law of Cosines)

The true-north bearing (initial heading) of the great-circle path represents the most direct, physically shortest direction to Mecca. This is universally accepted as the standard Qibla direction in Islamic jurisprudence.

### Algorithm
The engine computes the azimuth $A$ from true north using spherical trigonometry:
$$ \tan(A) = \frac{\sin(\Delta\lambda)}{\cos(\phi_1)\tan(\phi_2) - \sin(\phi_1)\cos(\Delta\lambda)} $$
Where:
- $\phi_1$ is the observer's latitude.
- $\phi_2$ is Mecca's latitude.
- $\Delta\lambda$ is the difference in longitude.

**Time Complexity:** `O(1)`

---

## 3. Rhumb-Line Bearing (Loxodrome)

A rhumb line (loxodrome) is a path of constant bearing. While the great-circle path is physically shorter, its compass heading changes continuously as one travels along it. A rhumb line heading remains constant. 

Although rarely used for Qibla (as it is not the shortest path), the engine provides the rhumb-line bearing via `getQiblaAdvanced()` for specialized marine and aeronautical applications.

### Algorithm
It involves Mercator projection logic, computing the projected difference in latitude ($\Delta\psi$) and the difference in longitude ($\Delta\lambda$). The constant bearing is the arctangent of these ratios.

**Time Complexity:** `O(1)`
