import type { PrayerMethodConfig } from '../types/index.js';
import { tand, atand } from '../../internal/trig.js';

/**
 * Returns the target zenith angle in degrees for Fajr.
 */
export function getFajrZenith(method: PrayerMethodConfig): number {
  return 90 + method.fajrAngle;
}

/**
 * Returns the target zenith angle in degrees for Sunrise/Sunset.
 */
export function getSunriseSunsetZenith(
  refractionDeg: number,
  semidiameterDeg: number,
  horizontalParallaxDeg: number,
  dipDeg: number
): number {
  return 90 + refractionDeg + semidiameterDeg - horizontalParallaxDeg + dipDeg;
}

/**
 * Calculates the true zenith angle and corrected zenith angle for Asr.
 *
 * @param latitude The observer's latitude in degrees.
 * @param declination The solar declination in degrees.
 * @param sf The shadow factor (1 for Shafi, 2 for Hanafi).
 * @param refractionDeg The atmospheric refraction in degrees at Asr's true altitude.
 */
export function getAsrZenith(
  latitude: number,
  declination: number,
  sf: number,
  refractionDeg: number
): { thetaTrueAsr: number; thetaAsr: number } {
  const thetaNoon = Math.abs(latitude - declination);
  const tanThetaNoon = tand(thetaNoon);
  const cotAsr = sf + tanThetaNoon;

  if (cotAsr <= 0) {
    return { thetaTrueAsr: NaN, thetaAsr: NaN };
  }

  const alphaTrueAsr = atand(1 / cotAsr);
  const thetaTrueAsr = 90 - alphaTrueAsr;
  const thetaAsr = thetaTrueAsr + refractionDeg;

  return { thetaTrueAsr, thetaAsr };
}

/**
 * Returns the target zenith angle in degrees for Maghrib if angle-based.
 */
export function getMaghribZenith(method: PrayerMethodConfig): number | null {
  if (method.maghribAngle !== undefined && method.maghribAngle !== null) {
    return 90 + method.maghribAngle;
  }
  return null;
}

/**
 * Returns the target zenith angle in degrees for Isha if angle-based.
 */
export function getIshaZenith(method: PrayerMethodConfig): number | null {
  if (method.ishaAngle !== undefined && method.ishaAngle !== null) {
    return 90 + method.ishaAngle;
  }
  return null;
}
