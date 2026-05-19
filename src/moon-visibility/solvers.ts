import { norm360, sind, cosd } from '../internal/math.js';
import { calculateMoonEphemeris, calculateMoonSlope, calculateMoonAltitude } from './ephemeris.js';
import { getDeltaT } from '../internal/time.js';

/**
 * Solves for Moon Transit using iterative approach.
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
 * Solves for Moon Rise or Set using Bisection Method around transit.
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

  // Let's first evaluate the endpoints to check for polar cases
  const mTransit = calculateMoonEphemeris(jdMidnight + transitUT / 24.0, deltaT);
  const hTransit = calculateMoonAltitude(mTransit.GHA, mTransit.DEC, lat, lon);
  const hRefTransit = 0.7275 * mTransit.HP - 0.5667;

  // If the peak altitude at transit is below the horizon, it never rises.
  if (hTransit < hRefTransit) {
    if (isPolar) {
      return null;
    }
  }

  // Let's also check the anti-transit (minimum) point
  const antiTransitUT = type === 'rise' ? transitUT - 12.5 : transitUT + 12.5;
  const mMin = calculateMoonEphemeris(jdMidnight + antiTransitUT / 24.0, deltaT);
  const hMin = calculateMoonAltitude(mMin.GHA, mMin.DEC, lat, lon);
  const hRefMin = 0.7275 * mMin.HP - 0.5667;

  // If the minimum altitude is above the horizon, it never sets.
  if (hMin > hRefMin) {
    if (isPolar) {
      return null;
    }
  }

  // Stage 1: Standard Search Window (transitUT +/- 12.5 hours)
  let ut0 = type === 'rise' ? transitUT - 12.5 : transitUT;
  let ut1 = type === 'rise' ? transitUT : transitUT + 12.5;
  let resolvedUT = runBisection(ut0, ut1);
  if (resolvedUT !== null) {
    return resolvedUT;
  }

  // Stage 2: Expanded Search Window for non-polar recovery
  if (!isPolar) {
    let expandedUt0 = type === 'rise' ? transitUT - 14.5 : transitUT - 2;
    let expandedUt1 = type === 'rise' ? transitUT + 2 : transitUT + 14.5;
    resolvedUT = runBisection(expandedUt0, expandedUt1);
    if (resolvedUT !== null) {
      return resolvedUT;
    }

    // Stage 3: Absolute astronomical fallback for non-polar regions (transit +/- 6 hours)
    return type === 'rise' ? transitUT - 6.0 : transitUT + 6.0;
  }

  return null;

  // Helper bisection function
  function runBisection(startUT: number, endUT: number): number | null {
    let low = startUT;
    let high = endUT;

    const mLow = calculateMoonEphemeris(jdMidnight + low / 24.0, deltaT);
    const hLow = calculateMoonAltitude(mLow.GHA, mLow.DEC, lat, lon);
    const hRefLow = 0.7275 * mLow.HP - 0.5667;

    const mHigh = calculateMoonEphemeris(jdMidnight + high / 24.0, deltaT);
    const hHigh = calculateMoonAltitude(mHigh.GHA, mHigh.DEC, lat, lon);
    const hRefHigh = 0.7275 * mHigh.HP - 0.5667;

    const signLow = hLow - hRefLow;
    const signHigh = hHigh - hRefHigh;

    if (signLow * signHigh > 0) {
      // No root (or even number of roots) in this range
      return null;
    }

    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2;
      const m = calculateMoonEphemeris(jdMidnight + mid / 24.0, deltaT);
      const h = calculateMoonAltitude(m.GHA, m.DEC, lat, lon);
      const hRef = 0.7275 * m.HP - 0.5667;

      const signMid = h - hRef;

      if (Math.abs(high - low) * 3600 < 0.1) {
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

import { calculateSolar } from '../internal/solar.js';
import { calculateNutation } from '../internal/nutation.js';

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
  
  for (let i = 0; i < 60; i++) {
    const jdMean = (low + high) / 2;
    const moon = calculateMoonEphemeris(jdMean, deltaT);
    
    const T = (jdMean - 2451545.0) / 36525.0;
    const TE = T + deltaT / (36525.0 * 86400.0);
    const nut = calculateNutation(TE);
    const solar = calculateSolar(jdMean, nut.deltaPsi, nut.eps, TE, 0.1 * TE, T);
    
    let diff = solar.lambdaApp - moon.L;
    diff = norm360(diff);
    
    const sinDiff = sind(diff);
    
    if (targetDiff === 180) {
      // Full Moon: bisection target is 180
      if (sinDiff > 0) {
        high = jdMean;
      } else {
        low = jdMean;
      }
    } else {
      // New Moon: bisection target is 0 / 360
      if (sinDiff < 0) {
        high = jdMean;
      } else {
        low = jdMean;
      }
    }

    if (Math.abs(high - low) < 1e-7) break;
  }
  return (low + high) / 2;
}
