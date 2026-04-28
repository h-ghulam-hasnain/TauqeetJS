import { norm360, sind, cosd, acosd } from '../core/math.js';
import { getJulianDate, getDeltaT } from '../core/time.js';
import { calculateNutation } from '../astronomy/nutation.js';
import { calculateSolar } from '../astronomy/solar.js';
import { calculateMoon, MoonResult } from '../astronomy/moon.js';
import { Coordinates } from '../prayer/types/index.js';
import { Result, validateInputs, Failure, Success } from '../core/result.js';

export interface MoonRiseSetResult {
  rise?: Date;
  set?: Date;
  transit?: Date;
}

/**
 * Creates a Moon engine instance using closures.
 */
export function createMoonEngine(coords: Coordinates) {
  const _coords = coords;

  const toDate = (baseDate: Date, utcHours: number): Date => {
    const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0));
    if (isNaN(utcHours) || !isFinite(utcHours)) return new Date(NaN);
    
    const totalMs = Math.round(utcHours * 3600 * 1000);
    d.setUTCMilliseconds(totalMs);
    return d;
  };

  const getMoonAt = (date: Date): MoonResult => {
    const jd = getJulianDate(date);
    const dt = getDeltaT(date.getUTCFullYear());
    const jde = jd + dt / 86400;
    const te = (jde - 2451545) / 36525;
    const t = (jd - 2451545) / 36525;
    const tau = 0.1 * te;
    const nut = calculateNutation(te);
    const solar = calculateSolar(jd, nut.deltaPsi, nut.eps, te, tau, t);
    
    const t2 = t * t;
    const t3 = t2 * t;
    const ghaaMean = (280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * t2 - t3 / 38710000) % 360;
    const ghaaTrue = (ghaaMean + nut.deltaPsi * Math.cos(nut.eps * Math.PI / 180)) % 360;

    return calculateMoon(jd, te, nut.deltaPsi, nut.eps, ghaaTrue, solar.lambdaApp, solar.RA, solar.DEC);
  };

  const solveTransit = (date: Date, initialUtc: number): Date => {
    let currentUtc = initialUtc;
    for (let i = 0; i < 3; i++) {
      const checkDate = toDate(date, currentUtc);
      const moon = getMoonAt(checkDate);
      let H = moon.GHA + _coords.longitude;
      if (H > 180) H -= 360;
      if (H < -180) H += 360;
      currentUtc -= H / 15;
    }
    return toDate(date, currentUtc);
  };

  const solveRiseSet = (date: Date, transit: Date, side: 'rise' | 'set'): Date => {
    if (isNaN(transit.getTime())) return new Date(NaN);
    const transitUtc = transit.getUTCHours() + transit.getUTCMinutes() / 60 + transit.getUTCSeconds() / 3600;
    const h0 = -0.833;
    
    let currentUtc = side === 'rise' ? (transitUtc - 6 + 24) % 24 : (transitUtc + 6 + 24) % 24;
    let prevUtc = currentUtc;

    for (let i = 0; i < 7; i++) {
      const checkDate = toDate(date, currentUtc);
      const moon = getMoonAt(checkDate);
      const denominator = cosd(_coords.latitude) * cosd(moon.DEC);
      
      if (Math.abs(denominator) < 1e-10) return new Date(NaN);

      const cosH = (sind(h0) - sind(_coords.latitude) * sind(moon.DEC)) / denominator;
      if (cosH > 1 || cosH < -1) return new Date(NaN);

      const H = acosd(cosH) / 15;
      let LHA = moon.GHA + _coords.longitude;
      if (LHA > 180) LHA -= 360;
      if (LHA < -180) LHA += 360;
      const localTransit = currentUtc + LHA / 15;

      currentUtc = side === 'rise' ? localTransit - H : localTransit + H;
      if (Math.abs(currentUtc - prevUtc) * 3600 < 0.1) break;
      prevUtc = currentUtc;
    }
    return toDate(date, currentUtc);
  };

  return {
    /**
     * Calculates moonrise, moonset, and transit for a given date.
     * Returns a Result object.
     */
    calculate: (date: Date): Result<MoonRiseSetResult> => {
      try {
        const transitUtc = 12 - (_coords.longitude / 15);
        const transit = solveTransit(date, transitUtc);
        const rise = solveRiseSet(date, transit, 'rise');
        const set = solveRiseSet(date, transit, 'set');
        
        const result: MoonRiseSetResult = { rise, set, transit };
        
        // If all are invalid, return failure
        if (isNaN(transit.getTime()) && isNaN(rise.getTime()) && isNaN(set.getTime())) {
          return Failure('Could not calculate moon times for this location/date.');
        }
        
        return Success(result);
      } catch (e) {
        return Failure(e instanceof Error ? e.message : 'Unknown moon calculation error');
      }
    }
  };
}

export function getMoonTimes(date: Date, latitude: number, longitude: number): Result<MoonRiseSetResult> {
  const validation = validateInputs(latitude, longitude, date);
  if (!validation.success) return validation as any;

  try {
    const engine = createMoonEngine({ latitude, longitude });
    return engine.calculate(date);
  } catch (e) {
    return Failure(e instanceof Error ? e.message : 'Unknown error during moon calculation');
  }
}
