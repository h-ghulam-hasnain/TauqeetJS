export interface NutationResult {
  /** Nutation in longitude Δψ (degrees) — IAU 1980 */
  readonly deltaPsi: number;
  /** Nutation in obliquity Δε (degrees) — IAU 1980 */
  readonly deltaEps: number;
  /** Mean obliquity of the ecliptic ε₀ (degrees) */
  readonly eps0: number;
  /** True obliquity of the ecliptic ε = ε₀ + Δε (degrees) */
  readonly eps: number;
}

/**
 * Geocentric apparent solar position for a given instant.
 * Frame: ecliptic-of-date with IAU 1980 nutation and aberration applied.
 * All angular quantities in DEGREES unless noted.
 */
export interface SolarPositionResult {
  /** Greenwich Mean Sidereal Time (degrees, 0–360) */
  readonly gmst: number;
  /** Greenwich Apparent Sidereal Time = GMST + Δψ·cos(ε) (degrees, 0–360) */
  readonly gast: number;
  /** Apparent Right Ascension, ecliptic-of-date (degrees, 0–360) */
  readonly rightAscension: number;
  /** Apparent Declination (degrees, −90 to +90) */
  readonly declination: number;
  /** Greenwich Hour Angle = GAST − RA (degrees, 0–360) */
  readonly gha: number;
  /** Sidereal Hour Angle = 360° − RA (degrees, 0–360) */
  readonly sha: number;
  /**
   * Angular semidiameter (ARCMINUTES).
   * Formula: 959.63 / distanceAu / 60
   * Typical range: 15.74' (aphelion) – 16.29' (perihelion)
   */
  readonly semidiameter: number;
  /**
   * Equatorial horizontal parallax (ARCMINUTES).
   * Formula: 8.794 / distanceAu / 60
   * Typical value: ~0.0024' (negligible for most purposes)
   */
  readonly horizontalParallax: number;
  /**
   * Equation of Time (minutes of time).
   * EoT > 0 → apparent Sun transits BEFORE 12:00 UT
   * EoT < 0 → apparent Sun transits AFTER  12:00 UT
   * Practical range: −14.3 min (mid-Feb) to +16.4 min (early Nov)
   */
  readonly equationOfTime: number;
  /** Geocentric distance (AU) */
  readonly distanceAu: number;
  /** Apparent ecliptic longitude λ, of-date (degrees, 0–360) */
  readonly apparentLongitude: number;
  /** Apparent ecliptic latitude β (degrees, ~0 for the Sun) */
  readonly apparentLatitude: number;
}


