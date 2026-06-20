import { computeLunarPhase, dateToJulianDay, calculateDeltaT } from '../../astronomy/index.js';
import type { MoonPhaseResult } from '../types/MoonPhase.js';

/**
 * Calculates the current moon phase, elongation, and illuminated fraction.
 *
 * @param date The date for which to compute the phase.
 * @returns An object containing elongation, illuminated fraction, and phase name.
 */
export function getMoonPhase(date: Date): MoonPhaseResult {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  const j = dateToJulianDay(year, month, day);
  const deltaT = calculateDeltaT(year);

  const phaseData = computeLunarPhase(j, ut, deltaT);

  let phaseName = 'New';
  const el = phaseData.elongation;

  // Account for slight floating point variations when checking exact phases
  const epsilon = 1.0;
  if (el < epsilon || el > 360 - epsilon) phaseName = 'New';
  else if (el >= epsilon && el < 90 - epsilon) phaseName = 'Waxing Crescent';
  else if (Math.abs(el - 90) <= epsilon) phaseName = 'First Quarter';
  else if (el > 90 + epsilon && el < 180 - epsilon) phaseName = 'Waxing Gibbous';
  else if (Math.abs(el - 180) <= epsilon) phaseName = 'Full';
  else if (el > 180 + epsilon && el < 270 - epsilon) phaseName = 'Waning Gibbous';
  else if (Math.abs(el - 270) <= epsilon) phaseName = 'Last Quarter';
  else if (el > 270 + epsilon) phaseName = 'Waning Crescent';

  return {
    elongation: phaseData.elongation,
    illuminatedFraction: phaseData.illuminatedFraction,
    phaseName,
  };
}
