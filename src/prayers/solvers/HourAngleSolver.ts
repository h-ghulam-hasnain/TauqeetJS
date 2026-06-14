import { cosd, sind, acosd } from '../../internal/trig.js';

/**
 * Computes the Solar Hour Angle (H) in degrees using the spherical law of cosines.
 * Returns null if the sun never reaches the target zenith angle at the given latitude and declination.
 *
 * @param targetZenithDeg The target zenith angle in degrees (e.g. 90 + 34/60 + SD - HP for sunset/sunrise, or 90 + twilightAngle for Fajr/Isha).
 * @param latitudeDeg The observer's latitude in degrees.
 * @param declinationDeg The solar declination in degrees.
 * @returns The hour angle in degrees, or null if mathematically impossible (sun does not reach this zenith).
 */
export function solveHourAngle(
  targetZenithDeg: number,
  latitudeDeg: number,
  declinationDeg: number
): number | null {
  const denominator = cosd(latitudeDeg) * cosd(declinationDeg);
  if (Math.abs(denominator) < 1e-10) {
    return null; // Singularity / poles
  }

  const cosH = (cosd(targetZenithDeg) - sind(latitudeDeg) * sind(declinationDeg)) / denominator;

  if (cosH > 1 || cosH < -1) {
    return null; // Sun never reaches this zenith angle
  }

  return acosd(cosH);
}
