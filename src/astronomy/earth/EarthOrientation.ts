import { computeSiderealTime, type SiderealTimeResult } from '../time/SiderealTime.js';

/**
 * Computes the Apparent Sidereal Time (AST).
 *
 * @remarks
 * AST is the Greenwich Mean Sidereal Time (GMST) corrected for the equation of the equinoxes,
 * which accounts for the nutation of the Earth's axis.
 *
 * @param jd - The Julian Day.
 * @param t - The time in Julian centuries since J2000.0.
 * @param deltaPsi - The nutation in longitude (in degrees).
 * @param eps - The true obliquity of the ecliptic (in degrees).
 * @returns A result object containing the apparent sidereal time in both hours and degrees.
 */
export function computeApparentSiderealTime(
  jd: number,
  t: number,
  deltaPsi: number,
  eps: number
): SiderealTimeResult {
  return computeSiderealTime(jd, t, deltaPsi, eps);
}
