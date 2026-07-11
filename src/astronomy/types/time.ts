/**
 * Represents the calendar components of a specific Julian Date.
 *
 * @remarks
 * Useful for extracting traditional calendar dates from astronomical calculations.
 *
 * @example
 * ```typescript
 * const dateComps: JulianDateComponents = { year: 2024, month: 4, day: 8.5 };
 * console.log(dateComps.year); // 2024
 * ```
 */
export interface JulianDateComponents {
  /** The fractional day of the month (1.0 to 31.999). */
  readonly day: number;
  /** The month of the year (1 for January to 12 for December). */
  readonly month: number;
  /** The astronomical year (e.g., 2024). */
  readonly year: number;
}

/**
 * Contains derived time arguments used extensively in astronomical ephemeris equations.
 *
 * @remarks
 * These arguments represent centuries or millennia since the standard epoch J2000.0.
 *
 * @example
 * ```typescript
 * const jd = 2451545.0; // J2000.0
 * const args = timeArguments(jd, 69.184); // jd, deltaT
 * console.log(args.t); // Julian centuries since J2000.0
 * ```
 */
export interface TimeArgument {
  /** The Universal Time Julian Date (UT). */
  readonly jd: number;
  /** The Ephemeris Time Julian Date (Terrestrial Time, TT). */
  readonly jde: number;
  /** Julian centuries since J2000.0 (UT). */
  readonly t: number;
  /** Julian centuries since J2000.0 (Ephemeris Time). */
  readonly te: number;
  /** Julian millennia since J2000.0 (Ephemeris Time). */
  readonly tau: number;
}
