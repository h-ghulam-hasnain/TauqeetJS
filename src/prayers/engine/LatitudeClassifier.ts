import { degreesToRadians } from '../../internal/angles.js';

export enum LatitudeCase {
  NORMAL = 'NORMAL',
  CONTINUOUS_TWILIGHT = 'CONTINUOUS_TWILIGHT',
  POLAR_NIGHT = 'POLAR_NIGHT',
  POLAR_DAY = 'POLAR_DAY',
  REGIONAL_FALLBACK = 'REGIONAL_FALLBACK',
}

/**
 * Classifies the latitude case for a given latitude, solar declination, and twilight angle.
 *
 * @param latitude observer's latitude in degrees.
 * @param declination solar declination in degrees.
 * @param twilightAngle twilight angle in degrees (positive value, e.g. 18).
 * @returns The classified LatitudeCase.
 */
export function classifyLatitude(
  latitude: number,
  declination: number,
  twilightAngle: number
): LatitudeCase {
  // 1. Pole Singularity / Extreme Polar region check (Case 5)
  if (Math.abs(latitude) >= 89.9) {
    return LatitudeCase.REGIONAL_FALLBACK;
  }

  const phiRad = degreesToRadians(latitude);
  const deltaRad = degreesToRadians(declination);

  // 2. Compute noon and midnight solar altitudes
  const sinNoon = Math.sin(phiRad) * Math.sin(deltaRad) + Math.cos(phiRad) * Math.cos(deltaRad);
  const sinMidnight = Math.sin(phiRad) * Math.sin(deltaRad) - Math.cos(phiRad) * Math.cos(deltaRad);

  const hNoonDeg = Math.asin(Math.max(-1, Math.min(1, sinNoon))) * (180 / Math.PI);
  const hMidnightDeg = Math.asin(Math.max(-1, Math.min(1, sinMidnight))) * (180 / Math.PI);

  if (hNoonDeg <= 0) {
    return LatitudeCase.POLAR_NIGHT; // Sun never rises (Case 3)
  }

  if (hMidnightDeg >= 0) {
    return LatitudeCase.POLAR_DAY; // Sun never sets (Case 4)
  }

  if (hMidnightDeg >= -twilightAngle) {
    return LatitudeCase.CONTINUOUS_TWILIGHT; // Sun sets but does not dip below twilight angle (Case 2)
  }

  return LatitudeCase.NORMAL; // Case 1
}
