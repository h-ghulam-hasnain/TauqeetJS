import { norm360 } from '../internal/math.js';
import { MoonEphemeris } from './ephemeris.js';
import { MoonDiskAnalytics } from './types.js';
import { calculateSolar } from '../internal/solar.js';
import { calculateNutation } from '../internal/nutation.js';
import { findMoonPhase } from './solvers.js';

export function calculateDiskAnalytics(
  jd: number,
  ephemeris: MoonEphemeris,
  deltaT: number
): MoonDiskAnalytics {
  const T = (jd - 2451545.0) / 36525.0;
  const TE = T + deltaT / (36525.0 * 86400.0);
  const Tau = 0.1 * TE;
  
  const nut = calculateNutation(TE);
  const solar = calculateSolar(jd, nut.deltaPsi, nut.eps, TE, Tau, T);

  let diff = ephemeris.L - solar.lambdaApp;
  diff = norm360(diff);
  
  // Calculate exact jdNewMoon for age calculation using a safe 4-day window around age_approx
  const age_approx = (diff / 360) * 29.530588853;
  const jdNewMoon = findMoonPhase(jd - age_approx - 2, jd - age_approx + 2, 0, deltaT);
  const age = jd - jdNewMoon;

  // Determine Phase Name
  let phase = '';
  const k = ephemeris.illumination * 100;
  
  const isWaxing = diff < 180;

  if (k < 1) phase = 'New Moon';
  else if (k > 99) phase = 'Full Moon';
  else if (k > 45 && k < 55) {
    phase = isWaxing ? 'First Quarter' : 'Last Quarter';
  } else {
    if (isWaxing) {
      phase = k < 50 ? 'Waxing Crescent' : 'Waxing Gibbous';
    } else {
      phase = k > 50 ? 'Waning Gibbous' : 'Waning Crescent';
    }
  }

  return {
    illumination: Math.round(k * 10) / 10,
    phase,
    age: Math.round(age * 100) / 100,
    elongation: Math.round(diff * 100) / 100,
    isWaxing
  };
}
