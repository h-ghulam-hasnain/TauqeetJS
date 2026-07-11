/**
 * Computes the mean obliquity of the ecliptic.
 *
 * @param te - Time in Julian ephemeris millennia since J2000.0.
 * @returns The mean obliquity in degrees.
 */
export function computeMeanObliquity(te: number): number {
  return 23.4392911111111 + (te * (te * (te * 0.001813 - 0.00059) - 46.815)) / 3600;
}

/**
 * Computes the true obliquity of the ecliptic by applying the nutation correction.
 *
 * @param eps0 - The mean obliquity in degrees.
 * @param deltaEps - The nutation in obliquity in degrees.
 * @returns The true obliquity in degrees.
 */
export function computeTrueObliquity(eps0: number, deltaEps: number): number {
  return eps0 + deltaEps;
}
