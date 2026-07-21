# Mathematical Engine: Prayer Times Calculation

The `tauqeet-js/prayers` calculation engine determines Islamic prayer times by executing exact spherical astronomical formulas combined with iterative root-finding techniques over the **VSOP87** solar ephemeris model.

Rather than relying on fixed table offsets or simple linear approximations, the engine calculates the sun’s exact geometric coordinates dynamically for any given location, date, and atmospheric condition.

*See also: [MATH_ASTRONOMY.md](./MATH_ASTRONOMY.md) for the underlying ephemeris and refraction models, and [MATH_HIGH_LATITUDE.md](./MATH_HIGH_LATITUDE.md) for polar boundary resolutions.*

---

## 1. Fundamental Astronomical Parameters

Every calculation begins by deriving three fundamental solar variables for a given Julian Date ($JD$):

1. **Solar Declination ($\delta$):** The angle between the rays of the Sun and the plane of the Earth's equator.
2. **Equation of Time ($EoT$):** The difference between apparent solar time and mean solar time (in minutes).
3. **Observer's Latitude ($\phi$) & Longitude ($\lambda$).**

---

## 2. Solar Transit (Dhuhr / Midday)

Dhuhr represents the moment when the Sun reaches its highest zenith point in the sky (Solar Noon or Transit).

### Formula

$$\text{Dhuhr UTC} = 12 + \frac{\text{Timezone Offset}}{15} - \frac{\lambda}{15} - \frac{EoT}{60}$$

* **Safety Offset:** A minor safety margin (typically $+1$ to $+2$ minutes) is added in practical applications to ensure the Sun has fully crossed the meridian into the afternoon phase.

---

## 3. Hour Angle ($\omega$) Logic for Horizon & Twilight Events

For solar events defined by a specific altitude angle $h$ (Fajr, Sunrise, Sunrise/Sunset Horizon, Maghrib, Isha), the engine computes the solar **Hour Angle ($\omega$)** using the Spherical Law of Cosines:

$$\cos(\omega) = \frac{\sin(h) - \sin(\phi) \cdot \sin(\delta)}{\cos(\phi) \cdot \cos(\delta)}$$

Where $h$ is the Sun's altitude relative to the horizon:

* **Fajr:** $h = -\theta_{\text{fajr}}$ (e.g., $-18^\circ$ or $-15^\circ$)
* **Sunrise / Sunset:** $h = -0.8333^\circ - \text{Refraction Adjustment}(\text{Temp}, \text{Pressure}) - \text{Elevation Correction}$
* **Isha:** $h = -\theta_{\text{isha}}$ (or fixed minute offset post-Maghrib)

### Calculation of Event Time

$$\text{Event Time} = \text{Dhuhr} \mp \left( \frac{\omega}{15} \right)$$

* Subtract $\left(\frac{\omega}{15}\right)$ for morning events (Fajr, Sunrise).
* Add $\left(\frac{\omega}{15}\right)$ for evening events (Sunset, Maghrib, Isha).

---

## 4. The Core Asr Logic (Shadow Multiplier)

Unlike other prayers governed by fixed solar angles, **Asr** is defined geometrically by the length of an object's shadow relative to its height at solar noon.

```
          Sun Rays
            \
             \ 
              \   
               \    
              +-----+  (Object of height 1)
              |     |
              |     |
--------------+-----+-------------------
              <----->
           Shadow Length

```

### Mathematical Formula

1. **Zenith Distance at Noon ($Z_0$):**

$$Z_0 = \vert{}\phi - \delta\vert{}$$


2. **Noon Shadow Length ($S_0$):**

$$S_0 = \tan(Z_0)$$


3. **Asr Target Altitude Angle ($h_{\text{asr}}$):**
Depending on the Madhab (School of Jurisprudence):
* **Standard (Shafi, Maliki, Hanbali, Jaafari):** Multiplier $m = 1$
* **Hanafi:** Multiplier $m = 2$


The total shadow length at Asr is:

$$S_{\text{asr}} = m + S_0 = m + \tan(\vert{}\phi - \delta\vert{})$$


The required solar altitude $h_{\text{asr}}$ is computed via the cotangent relationship:

$$h_{\text{asr}} = \operatorname{arccot}\left( m + \tan(\vert{}\phi - \delta\vert{}) \right) = \arctan\left( \frac{1}{m + \tan(\vert{}\phi - \delta\vert{})} \right)$$


4. **Hour Angle ($\omega_{\text{asr}}$):**
Once $h_{\text{asr}}$ is derived, it is substituted back into the Hour Angle equation:

$$\cos(\omega_{\text{asr}}) = \frac{\sin(h_{\text{asr}}) - \sin(\phi)\sin(\delta)}{\cos(\phi)\cos(\delta)}$$


$$\text{Asr Time} = \text{Dhuhr} + \frac{\omega_{\text{asr}}}{15}$$



---

## 5. From Initial Estimate to Pinpoint Precision (Iterative Root-Finding)

### The Core Problem: The Moving Target Paradox

The parameters $\delta$ (Declination) and $EoT$ (Equation of Time) are **not constant** throughout the day—they continuously change as the Earth moves along its orbit.

1. To calculate the exact time $T$ of Fajr, you need $\delta$ and $EoT$ at $T$.
2. But to know $\delta$ and $EoT$ at $T$, you must already know the exact time $T$!

### The Solution: Convergent Root-Finding Iteration

TauqeetJS resolves this mathematical loop using an iterative refinement process (similar to Newton-Raphson / Brent's Method) against the **VSOP87** ephemeris.

```text
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Initial Guess (T_0 = Solar Noon / Rough Approximation) │
  └────────────────────────────┬─────────────────────────────┘
                               │
                               ▼
  ┌──────────────────────────────────────────────────────────┐
  │ 2. Query VSOP87 for precise declination (δ_n) and        │
  │    Equation of Time (EoT_n) at candidate time T_n        │
  └────────────────────────────┬─────────────────────────────┘
                               │
                               ▼
  ┌──────────────────────────────────────────────────────────┐
  │ 3. Calculate actual Solar Altitude (h_calculated) at T_n │
  │    and derive new refined time candidate T_(n+1)         │
  └────────────────────────────┬─────────────────────────────┘
                               │
                               ▼
            ┌──────────────────────────────────────┐
            │ Is |T_(n+1) - T_n| < 0.001 seconds?  │
            └──────────┬─────────────────┬─────────┘
                       │                 │
                   NO  │                 │ YES
                       │                 │
                       ▼                 ▼
          [Loop back to Step 2]   [ CONVERGED! ]
                                  Returns exact time

```

### Iteration Step-by-Step Example (Fajr Calculation)

1. **Iteration 0 (Seed Guess):**
* The engine assumes $T_0 = \text{Midnight}$ or rough offset.
* Calculates $\delta(T_0)$ and $EoT(T_0)$ via VSOP87.
* Computes Hour Angle $\omega_0 \implies T_1 = 04:32:10\text{ AM}$.


2. **Iteration 1 (First Refinement):**
* The engine evaluates VSOP87 specifically at $T_1 = 04:32:10\text{ AM}$.
* Noticeable shift: $\delta$ and $EoT$ have slightly moved due to Earth's rotation over those hours.
* Re-evaluates Hour Angle $\omega_1 \implies T_2 = 04:31:42\text{ AM}$ (Delta: 28 seconds).


3. **Iteration 2 (Second Refinement):**
* Evaluates VSOP87 at $T_2 = 04:31:42\text{ AM}$.
* Re-evaluates Hour Angle $\omega_2 \implies T_3 = 04:31:41.8\text{ AM}$ (Delta: 0.2 seconds).


4. **Iteration 3 (Convergence):**
* Evaluates VSOP87 at $T_3$.
* Resulting difference $< 0.001$ seconds. The loop terminates.



**Efficiency:** Because VSOP87 terms are packed in parallel `Float64Array` buffers, this convergence loop finishes in **$< 0.01\text{ ms}$** per prayer event.

---

## 6. Comprehensive Summary Table

| Prayer | Governing Condition | Mathematical Formula / Target Altitude Angle ($h$) |
| --- | --- | --- |
| **Fajr** | Morning Twilight | $h = -\theta_{\text{fajr}}$ (e.g., $-18^\circ$) |
| **Sunrise** | Upper Limb On Horizon | $h = -0.8333^\circ - \text{Refraction}(\text{T, P}) - \text{Dip}(\text{Elevation})$ |
| **Dhahwa-e-Kubra** | Islamic Midday | $\text{Fajr Time} + \frac{\text{Sunset Time} - \text{Fajr Time}}{2}$ |
| **Dhuhr** | Solar Meridian Zenith Transit | $\text{Solar Noon} + \text{Safety Margin}$ |
| **Asr** | Object Shadow Multiplier ($m$) | $h_{\text{asr}} = \operatorname{arccot}\left(m + \tan(\vert{}\phi - \delta\vert{})\right)$ |
| **Maghrib** | Sunset + Twilight Horizon | $h = -0.8333^\circ - \text{Refraction} - \text{Dip}$ (or fixed angle) |
| **Isha** | Night Twilight Angle | $h = -\theta_{\text{isha}}$ (e.g., $-17^\circ$ / $-18^\circ$ or $+\Delta t$ post-Maghrib) |