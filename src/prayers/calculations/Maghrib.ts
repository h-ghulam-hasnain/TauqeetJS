import { solveIteratively } from '../solvers/IterativeSolver.js';
import type { IterativeSolverResult } from '../solvers/IterativeSolver.js';
import { computeRefraction, computeDipAngle } from '../corrections/HorizonCorrections.js';
import type { PrayerMethodConfig } from '../types/index.js';
import type { SolarEphemeris } from '../../internal/EphemerisService.js';

/**
 * Calculates the exact time of Maghrib.
 *
 * @remarks
 * Typically, Maghrib matches the time of sunset. However, some methods (like the Shia/Jaafari
 * methods) define Maghrib based on a specific twilight angle below the eastern horizon
 * after sunset, or apply a fixed minute offset.
 *
 * @param date - The target date for calculation.
 * @param latitude - Observer's latitude in decimal degrees.
 * @param longitude - Observer's longitude in decimal degrees.
 * @param _elevationMeters - Observer's elevation (unused directly here, but kept for interface consistency).
 * @param _temperatureC - Ambient temperature (unused directly here).
 * @param _pressureMbar - Atmospheric pressure (unused directly here).
 * @param method - The prayer method configuration.
 * @param sunsetResult - The previously calculated astronomical sunset time.
 * @returns The calculated `IterativeSolverResult` for Maghrib.
 */
export function calculateMaghrib(
  date: Date,
  latitude: number,
  longitude: number,
  _elevationMeters: number,
  _temperatureC: number,
  _pressureMbar: number,
  method: PrayerMethodConfig,
  sunsetResult: IterativeSolverResult | null
): IterativeSolverResult | null {
  // 1. If Maghrib is defined as minutes after Sunset (e.g. interval)
  const maghribMinutes = method.maghribMinutes;
  if (maghribMinutes !== undefined && maghribMinutes !== null) {
    if (!sunsetResult) return null;
    return {
      ...sunsetResult,
      time: new Date(sunsetResult.time.getTime() + maghribMinutes * 60000),
    };
  }

  // 2. If Maghrib is defined by a specific twilight angle
  if (method.maghribAngle !== undefined && method.maghribAngle !== null) {
    const targetZenithFn = () => 90 + method.maghribAngle!;
    const initialEstimate = 18 - longitude / 15;
    return solveIteratively(date, latitude, longitude, 'evening', targetZenithFn, initialEstimate);
  }

  // 3. Default: Maghrib is Sunset itself
  return sunsetResult;
}

/**
 * Calculates the exact astronomical time of sunset iteratively.
 *
 * @remarks
 * Sunset occurs when the upper limb of the solar disk geometrically crosses the horizon,
 * taking into account atmospheric refraction, solar semidiameter, and observer elevation (dip angle).
 *
 * @param date - The target date for calculation.
 * @param latitude - Observer's latitude in decimal degrees.
 * @param longitude - Observer's longitude in decimal degrees.
 * @param elevationMeters - Elevation above sea level in meters to account for horizon dip.
 * @param temperatureC - Ambient temperature in Celsius.
 * @param pressureMbar - Atmospheric pressure in millibars.
 * @returns The calculated `IterativeSolverResult` for sunset, or null if the sun does not set.
 */
export function calculateSunset(
  date: Date,
  latitude: number,
  longitude: number,
  elevationMeters: number,
  temperatureC: number,
  pressureMbar: number
): IterativeSolverResult | null {
  const dip = computeDipAngle(elevationMeters);
  const refraction = computeRefraction(0, temperatureC, pressureMbar);

  const targetZenithFn = (ephemeris: SolarEphemeris) => {
    return 90 + refraction + ephemeris.semidiameter / 60 - ephemeris.horizontalParallax / 60 + dip;
  };

  const initialEstimate = 18 - longitude / 15;

  return solveIteratively(date, latitude, longitude, 'evening', targetZenithFn, initialEstimate);
}
