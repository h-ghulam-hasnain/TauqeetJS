import { getRefraction } from './Refraction.js';

/**
 * Computes atmospheric refraction in degrees at a given apparent altitude.
 * Uses the Bennett formula internally.
 *
 * @param altitudeDeg Solar altitude in degrees.
 * @param tempC Temperature in Celsius.
 * @param pressureMbar Pressure in millibars.
 * @returns Refraction correction in degrees.
 */
export function computeRefraction(
  altitudeDeg: number,
  tempC: number,
  pressureMbar: number
): number {
  // getRefraction returns refraction in arcminutes, convert to degrees
  return getRefraction(altitudeDeg, tempC, pressureMbar) / 60;
}

/**
 * Computes the horizon dip angle in degrees based on height above sea level.
 *
 * @param elevationMetres Elevation in meters.
 * @returns Dip angle in degrees.
 */
export function computeDipAngle(elevationMetres: number): number {
  if (elevationMetres <= 0) return 0;
  return 0.02933333 * Math.sqrt(elevationMetres);
}

/**
 * Returns the standard sea level atmospheric refraction (34' / 0.5667 degrees)
 * for when default temperature and pressure are assumed.
 */
export function computeSeaLevelRefraction(): number {
  return 34 / 60;
}
