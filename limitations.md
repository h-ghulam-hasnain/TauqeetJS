# Limitations of Tauqeet-JS

While `tauqeet-js` utilizes highly precise astronomical models (such as the full untruncated VSOP87D solar theory, the 1024-term ELP2000-82B lunar theory, and the 77-term IAU 2000B nutation model) to deliver sub-milliarcsecond and sub-minute accuracy, it is specifically tailored for Earth-bound observers. 

Before integrating `tauqeet-js` into your systems, please be aware of the following scope limitations:

## 1. Domain Specificity (Only Sun & Moon)
`tauqeet-js` is strictly designed for **Islamic Astronomical Calculations** (Prayer times, Hijri calendar conversions, Crescent visibility, Eclipses, and Qibla). 
* **No Planetary Support:** It does not compute positions for other planets (Mercury, Venus, Mars, Jupiter, etc.), planetary moons, comets, or asteroids.
* **No Satellite Tracking:** It does not support Two-Line Element (TLE) tracking, SGP4 propagation, or artificial satellite observation (e.g., ISS tracking).
* **No Star Catalogs:** It does not track distant stars, galaxies, or deep-sky objects (with the exception of fundamental reference frame computations for the Qibla).

## 2. Temporal Bounds (Time Validity)
While the mathematical series used in this library are highly accurate, they are fundamentally built on polynomials and trigonometric series fitted to modern observations.
* **Historical and Future Degradation:** The accuracy of the VSOP87 and ELP2000-82B models slowly degrades as you move thousands of years into the past or future. The calculations are incredibly reliable between **2000 BCE and 3000 CE**, but should not be used for geological timescales.
* **ΔT (Delta T) Unpredictability:** Earth's rotation slows down unpredictably due to tidal friction and geological events. Our ΔT implementation uses the highly regarded Espenak-Meeus polynomials, which closely match historical eclipse records. However, any predictions of eclipses or exact event timings far into the future (beyond a few hundred years) are inherently uncertain due to the unpredictable fluctuations in Earth's rotation.

## 3. Geophysical & Topocentric Scope
* **Micro-level Polar Motion:** The library computes Earth nutation and precession but does not actively download real-time **IERS Earth Orientation Parameters** (EOP) to correct for daily polar motion. This means an error margin of a fraction of an arcsecond is inherent when mapping absolute celestial coordinates to the Earth's crust.
* **Standard Horizon:** Altitude corrections account for the observer's elevation, but they assume a flat, unobstructed horizon. The library does not use a Digital Elevation Model (DEM) to account for local mountains, buildings, or valleys blocking the sun.

## 4. Atmospheric Refraction Approximations
Astronomical refraction—which bends light near the horizon and directly affects sunrise, sunset, and twilight times—is calculated using highly respected temperature and pressure formulas. 
* **Weather Dependency:** The default calculations assume a standard atmosphere (e.g., 1010 mb pressure, 10°C). Severe local weather, extreme atmospheric pressure anomalies, or severe temperature inversions (mirages) can cause the actual observed sunrise/sunset to differ from the computed times by up to a minute or more.

## 5. Not for Spacecraft Navigation
Despite its rigorous precision, `tauqeet-js` is **not designed for spacecraft navigation or orbital mechanics**.
* It lacks the relativistic light-time corrections, Barycentric Dynamical Time (TDB) mappings, and sub-kilometer JPL numerical integration (like DE430) required for directing probes or calculating deep space trajectories.
* For research-grade astrophysics or spacecraft operations, a library relying on binary JPL ephemerides (such as Python's `Skyfield`) is strictly required.
