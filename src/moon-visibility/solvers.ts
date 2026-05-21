import { norm360, sind, cosd } from '../internal/math.js';
import { calculateMoonEphemeris, calculateMoonSlope, calculateMoonAltitude } from './ephemeris.js';
import { calculateSolar } from '../internal/solar.js';
import { calculateNutation } from '../internal/nutation.js';

/**
 * Solves for Moon Transit using iterative approach.
 * Returns UT hours relative to jdMidnight.
 */
export function solveMoonTransit(jdMidnight: number, initialUT: number, deltaT: number, lon: number): number {
  let ut = initialUT;
  for (let i = 0; i < 10; i++) {
    const jdTime = jdMidnight + ut / 24.0;
    const moon = calculateMoonEphemeris(jdTime, deltaT);
    let t = norm360(moon.GHA + lon);
    if (t > 180) t -= 360;
    
    if (Math.abs(t) < 1e-6) break;
    ut = ut - t / 15.04107; // 15.041 is approx degrees per hour for moon
  }
  return ut;
}

/**
 * Solves for Moon Rise or Set.
 * Returns the fractional Julian Day of the event, or null if it never rises/sets (polar regions).
 */
export function solveMoonRiseSet(
  jdMidnight: number, 
  transitUT: number, 
  deltaT: number, 
  lat: number, 
  lon: number, 
  type: 'rise' | 'set'
): number | null {
  const isPolar = Math.abs(lat) >= 65;
  const jdT = jdMidnight + transitUT / 24.0;

  // Let's first evaluate the endpoints to check for polar cases
  const mTransit = calculateMoonEphemeris(jdT, deltaT);
  const hTransit = calculateMoonAltitude(mTransit.GHA, mTransit.DEC, lat, lon);
  const hRefTransit = 0.7275 * mTransit.HP - 0.5667;

  // If the peak altitude at transit is below the horizon, it never rises.
  if (hTransit < hRefTransit) {
    if (isPolar) {
      return null;
    }
  }

  // Check the anti-transit (minimum) point
  const jdMin = type === 'rise' ? jdT - 12.5 / 24.0 : jdT + 12.5 / 24.0;
  const mMin = calculateMoonEphemeris(jdMin, deltaT);
  const hMin = calculateMoonAltitude(mMin.GHA, mMin.DEC, lat, lon);
  const hRefMin = 0.7275 * mMin.HP - 0.5667;

  // If the minimum altitude is above the horizon, it never sets.
  if (hMin > hRefMin) {
    if (isPolar) {
      return null;
    }
  }

  // Stage 1: Standard Search Window (transitUT +/- 12.5 hours)
  let jd0 = type === 'rise' ? jdT - 12.5 / 24.0 : jdT;
  let jd1 = type === 'rise' ? jdT : jdT + 12.5 / 24.0;
  let resolvedJD = runBisection(jd0, jd1);
  if (resolvedJD !== null) {
    return resolvedJD;
  }

  // Stage 2: Expanded Search Window for non-polar recovery
  if (!isPolar) {
    let expandedJd0 = type === 'rise' ? jdT - 14.5 / 24.0 : jdT - 2.0 / 24.0;
    let expandedJd1 = type === 'rise' ? jdT + 2.0 / 24.0 : jdT + 14.5 / 24.0;
    resolvedJD = runBisection(expandedJd0, expandedJd1);
    if (resolvedJD !== null) {
      return resolvedJD;
    }

    // Stage 3: Absolute astronomical fallback for non-polar regions (transit +/- 6 hours)
    return type === 'rise' ? jdT - 6.0 / 24.0 : jdT + 6.0 / 24.0;
  }

  return null;

  // Helper bisection function using absolute Julian Dates
  function runBisection(startJD: number, endJD: number): number | null {
    let low = startJD;
    let high = endJD;

    const mLow = calculateMoonEphemeris(low, deltaT);
    const hLow = calculateMoonAltitude(mLow.GHA, mLow.DEC, lat, lon);
    const hRefLow = 0.7275 * mLow.HP - 0.5667;

    const mHigh = calculateMoonEphemeris(high, deltaT);
    const hHigh = calculateMoonAltitude(mHigh.GHA, mHigh.DEC, lat, lon);
    const hRefHigh = 0.7275 * mHigh.HP - 0.5667;

    const signLow = hLow - hRefLow;
    const signHigh = hHigh - hRefHigh;

    if (signLow * signHigh > 0) {
      return null;
    }

    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2;
      const m = calculateMoonEphemeris(mid, deltaT);
      const h = calculateMoonAltitude(m.GHA, m.DEC, lat, lon);
      const hRef = 0.7275 * m.HP - 0.5667;

      const signMid = h - hRef;

      if (Math.abs(high - low) * 86400 < 0.1) {
        return mid;
      }

      if (signMid * signLow < 0) {
        high = mid;
      } else {
        low = mid;
      }
    }
    return (low + high) / 2;
  }
}

/**
 * Finds the date/time of a specific lunar phase using Bisection.
 * @param jd0 Starting search Julian Date
 * @param jd1 Ending search Julian Date
 * @param targetDiff Target Elongation (0 for New Moon, 180 for Full Moon)
 * @param deltaT Astronomical delta T correction
 */
export function findMoonPhase(jd0: number, jd1: number, targetDiff: number, deltaT: number): number {
  let low = jd0;
  let high = jd1;
  let signChanged = false;

  let prevVal = getPhaseVal(jd0, targetDiff, deltaT);
  let bracketLow = jd0;
  let bracketHigh = jd1;

  for (let jd = jd0 + 0.5; jd <= jd1; jd += 0.5) {
    let val = getPhaseVal(jd, targetDiff, deltaT);
    if (prevVal * val <= 0 && Math.abs(val - prevVal) < 180) {
      bracketLow = jd - 0.5;
      bracketHigh = jd;
      signChanged = true;
      break;
    }
    prevVal = val;
  }

  if (!signChanged) {
    let val = getPhaseVal(jd1, targetDiff, deltaT);
    if (prevVal * val <= 0 && Math.abs(val - prevVal) < 180) {
      bracketLow = jd1 - 0.5;
      bracketHigh = jd1;
      signChanged = true;
    }
  }

  if (signChanged) {
    low = bracketLow;
    high = bracketHigh;
  }

  for (let i = 0; i < 60; i++) {
    const jdMean = (low + high) / 2;
    const val = getPhaseVal(jdMean, targetDiff, deltaT);

    // val goes from positive to negative, so if val > 0, the target is in the future.
    if (val > 0) {
      low = jdMean;
    } else {
      high = jdMean;
    }

    if (Math.abs(high - low) < 1e-7) break;
  }
  return (low + high) / 2;
}

function getPhaseVal(jd: number, targetDiff: number, deltaT: number): number {
  const moon = calculateMoonEphemeris(jd, deltaT);
  const T = (jd - 2451545.0) / 36525.0;
  const TE = T + deltaT / (36525.0 * 86400.0);
  const nut = calculateNutation(TE);
  const solar = calculateSolar(jd, nut.deltaPsi, nut.eps, TE, 0.1 * TE, T);

  let diff = solar.lambdaApp - moon.L;
  diff = norm360(diff);

  let angle = diff - targetDiff;
  // Normalize angle to [-180, 180]
  let val = angle % 360;
  if (val < -180) val += 360;
  if (val > 180) val -= 360;
  return val;
}
