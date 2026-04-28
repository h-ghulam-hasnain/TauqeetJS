/**
 * Core Prayer Time Engine.
 * Following strictly defined Successive Approximation Algorithmic Workflow.
 * Modularized and encapsulated using closures for privacy and small footprint.
 */
import { acosd, sind, cosd, tand, atan2d } from '../core/math.js';
import { getRefraction } from '../astronomy/refraction.js';
import { getJulianDate } from '../core/time.js';
import { calculateNutation } from '../astronomy/nutation.js';
import { calculateSolar, SolarResult } from '../astronomy/solar.js';
import { Coordinates, CalculationMethod, PrayerTimesResult } from './types/index.js';
import { PRESETS } from './constants/methods.js';
import { Result, Success, Failure } from '../core/result.js';

/**
 * Creates a prayer engine instance.
 * @param coords Observer coordinates.
 * @param method Calculation method preset.
 */
export const createPrayerEngine = (coords: Coordinates, method: CalculationMethod = 'Karachi') => {
  // Private variables via closure
  const _coords = coords;
  const _method = method;

  /**
   * Internal helper to convert UTC hours to a Date object.
   */
  const toDate = (baseDate: Date, utcHours: number): Date => {
    const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0));
    if (isNaN(utcHours)) return new Date(NaN);
    const totalSeconds = Math.round(utcHours * 3600);
    d.setUTCSeconds(totalSeconds);
    return d;
  };

  /**
   * Internal helper to get solar ephemeris at a specific date.
   */
  const getSolarAt = (date: Date): { solar: SolarResult, jd: number } => {
    const jd = getJulianDate(date);
    const dt = 70; // Fixed ΔT as requested in original logic
    const jde = jd + dt / 86400;
    const te = (jde - 2451545) / 36525;
    const t = (jd - 2451545) / 36525;
    const tau = 0.1 * te;
    const nut = calculateNutation(te);
    const solar = calculateSolar(jd, nut.deltaPsi, nut.eps, te, tau, t);
    return { solar, jd };
  };

  /**
   * Solves for solar transit (Noon).
   */
  const calculateTransit = (date: Date): Date => {
    let currentUtcTime = 12 - (_coords.longitude / 15);
    for (let i = 0; i < 3; i++) {
      const checkDate = toDate(date, currentUtcTime);
      const { solar } = getSolarAt(checkDate);
      currentUtcTime = 12 - (_coords.longitude / 15) - (solar.EOT / 60);
    }
    return toDate(date, currentUtcTime);
  };

  /**
   * Solves iteratively for a target zenith angle.
   */
  const solveIteratively = (date: Date, angleBelowHorizon: number, side: 'morning' | 'evening'): Date => {
    let prevTime = side === 'morning' ? 6 : 18;
    let currentUtcTime = prevTime;

    for (let i = 0; i < 5; i++) {
      const checkDate = toDate(date, currentUtcTime);
      const { solar } = getSolarAt(checkDate);
      const denominator = cosd(_coords.latitude) * cosd(solar.DEC);

      if (Math.abs(denominator) < 1e-10) return new Date(NaN);

      const cosH = (sind(-angleBelowHorizon) - sind(_coords.latitude) * sind(solar.DEC)) / denominator;
      if (cosH > 1 || cosH < -1) return new Date(NaN);

      const H = acosd(cosH) / 15;
      const transit = 12 - (_coords.longitude / 15) - (solar.EOT / 60);
      currentUtcTime = side === 'morning' ? transit - H : transit + H;

      if (Math.abs(currentUtcTime - prevTime) * 3600 < 1) break;
      prevTime = currentUtcTime;
    }
    return toDate(date, currentUtcTime);
  };

  /**
   * Solves iteratively for Sunrise/Maghrib (with refraction and SD).
   */
  const solvePhenomenonIteratively = (date: Date, side: 'morning' | 'evening'): Date => {
    let prevTime = side === 'morning' ? 6 : 18;
    let currentUtcTime = prevTime;

    for (let i = 0; i < 5; i++) {
      const checkDate = toDate(date, currentUtcTime);
      const { solar } = getSolarAt(checkDate);
      const refraction = 34 / 60;
      const sd_deg = solar.SD / 3600;
      const hp_deg = solar.HP / 3600;
      const elevation = _coords.elevation || 0;
      const dip = 0.02933333 * Math.sqrt(elevation);

      const targetZenith = 90 + refraction + sd_deg - hp_deg + dip;
      const denominator = cosd(_coords.latitude) * cosd(solar.DEC);

      if (Math.abs(denominator) < 1e-10) return new Date(NaN);

      const cosH = (cosd(targetZenith) - sind(_coords.latitude) * sind(solar.DEC)) / denominator;
      if (cosH > 1 || cosH < -1) return new Date(NaN);

      const H = acosd(cosH) / 15;
      const transit = 12 - (_coords.longitude / 15) - (solar.EOT / 60);
      currentUtcTime = side === 'morning' ? transit - H : transit + H;

      if (Math.abs(currentUtcTime - prevTime) * 3600 < 1) break;
      prevTime = currentUtcTime;
    }
    return toDate(date, currentUtcTime);
  };

  /**
   * Solves iteratively for Asr.
   */
  const solveAsrIteratively = (date: Date, factor: number, dhuhr: Date, temperature: number, pressureMbar: number): Date => {
    const { solar: solarZuhr } = getSolarAt(dhuhr);
    const zZuhr = Math.abs(_coords.latitude - solarZuhr.DEC);
    const sdZuhr = solarZuhr.SD / 3600;
    const refrZuhr = getRefraction(90 - zZuhr, temperature, pressureMbar) / 60;
    const zZuhrVisual = zZuhr - refrZuhr - sdZuhr;

    let prevTime = 15;
    let currentUtcTime = prevTime;

    for (let i = 0; i < 5; i++) {
      const checkDate = toDate(date, currentUtcTime);
      const { solar } = getSolarAt(checkDate);
      const zAsrVisual = atan2d(tand(zZuhrVisual) + factor, 1);
      const refrAsr = getRefraction(90 - zAsrVisual, temperature, pressureMbar) / 60;
      const sdAsr = solar.SD / 3600;
      const targetZenith = zAsrVisual + refrAsr + sdAsr;

      const denominator = cosd(_coords.latitude) * cosd(solar.DEC);
      if (Math.abs(denominator) < 1e-10) return new Date(NaN);

      const cosH = (cosd(targetZenith) - sind(_coords.latitude) * sind(solar.DEC)) / denominator;
      if (cosH > 1 || cosH < -1) return new Date(NaN);

      const H = acosd(cosH) / 15;
      const transit = 12 - (_coords.longitude / 15) - (solar.EOT / 60);
      currentUtcTime = transit + H;

      if (Math.abs(currentUtcTime - prevTime) * 3600 < 1) break;
      prevTime = currentUtcTime;
    }
    return toDate(date, currentUtcTime);
  };

  // Exposed API
  return {
    calculate: (
      date: Date,
      asrFactor: number = 2,
      temperature: number = 10,
      pressureMbar: number = 1010.0,
      ishaAngleOverride?: number
    ): Result<PrayerTimesResult> => {
      try {
        const dhuhr = calculateTransit(date);
        const params = PRESETS[_method];

        const fajr = solveIteratively(date, params.fajrAngle, 'morning');
        const sunrise = solvePhenomenonIteratively(date, 'morning');

        const maghrib = params.maghribInterval
          ? new Date(sunrise.getTime() + params.maghribInterval * 60000)
          : params.maghribAngle
            ? solveIteratively(date, params.maghribAngle, 'evening')
            : solvePhenomenonIteratively(date, 'evening');

        const ishaAngle = ishaAngleOverride !== undefined ? ishaAngleOverride : (params.ishaAngle || 18);
        const isha = params.ishaInterval
          ? new Date(maghrib.getTime() + params.ishaInterval * 60000)
          : solveIteratively(date, ishaAngle, 'evening');

        const asr = solveAsrIteratively(date, asrFactor, dhuhr, temperature, pressureMbar);
        
        const dhahwaKubra = (isNaN(fajr.getTime()) || isNaN(maghrib.getTime()))
          ? new Date(NaN)
          : new Date((fajr.getTime() + maghrib.getTime()) / 2);

        const results: PrayerTimesResult = { 
          fajr, sunrise, dhahwaKubra, dhuhr, asr, maghrib, isha,
          format(type: 'iso8601' | 'unix' | '12h' | '24h', timeZone?: string) {
            const formatted: Record<string, string | number> = {};
            const keys: (keyof Omit<PrayerTimesResult, 'format'>)[] = ['fajr', 'sunrise', 'dhahwaKubra', 'dhuhr', 'asr', 'maghrib', 'isha'];
            
            for (const key of keys) {
              const d = this[key];
              if (!d || isNaN(d.getTime())) {
                formatted[key] = type === 'unix' ? NaN : 'Invalid Date';
                continue;
              }

              if (type === 'iso8601') {
                formatted[key] = d.toISOString();
              } else if (type === 'unix') {
                formatted[key] = Math.floor(d.getTime() / 1000);
              } else {
                const options: Intl.DateTimeFormatOptions = {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: type === '12h'
                };
                if (timeZone) {
                  options.timeZone = timeZone;
                }
                formatted[key] = new Intl.DateTimeFormat('en-US', options).format(d);
              }
            }
            return formatted as Record<Exclude<keyof PrayerTimesResult, 'format'>, string | number>;
          }
        };

        // Verify if any critical time is NaN (e.g. at extreme latitudes)
        if (isNaN(fajr.getTime()) || isNaN(dhuhr.getTime()) || isNaN(maghrib.getTime())) {
          return Failure('One or more prayer times could not be calculated (Extreme latitude or invalid date).');
        }

        return Success(results);
      } catch (e) {
        return Failure(e instanceof Error ? e.message : 'Unknown calculation error');
      }
    }
  };
};
