/**
 * Core Prayer Time Engine.
 * Modularized and encapsulated using closures for privacy and small footprint.
 */
import { Coordinates, CalculationMethod, PrayerTimesResult } from './types/index.js';
import { PRESETS } from './constants/methods.js';
import { Result, Success, Failure, ErrorCode } from '../core/result.js';
import { 
  calculateTransit, 
  solveIteratively, 
  solvePhenomenonIteratively, 
  solveAsrIteratively 
} from './solvers.js';

/**
 * Creates a prayer engine instance.
 * @param coords Observer coordinates.
 * @param method Calculation method preset.
 */
export const createPrayerEngine = (coords: Coordinates, method: CalculationMethod = 'Karachi') => {
  // Encapsulated state
  const _coords = coords;
  const _method = method;

  return {
    /**
     * Calculates prayer times for a specific date.
     */
    calculate: (
      date: Date,
      asrFactor: number = 2,
      temperature: number = 10,
      pressureMbar: number = 1010.0,
      ishaAngleOverride?: number,
      withMetadata: boolean = false
    ): Result<PrayerTimesResult> => {
      const params = PRESETS[_method];
      if (!params) return Failure(`Unknown method: ${_method}`);

      const resTransit = calculateTransit(date, _coords.longitude);
      const dhuhr = resTransit.time;
      
      const resFajr = solveIteratively(date, _coords, params.fajrAngle, 'morning');
      const fajr = resFajr.time;
      
      const resSunrise = solvePhenomenonIteratively(date, _coords, 'morning');
      const sunrise = resSunrise.time;

      const resMaghrib = params.maghribInterval
        ? { time: new Date(sunrise.getTime() + params.maghribInterval * 60000), DEC: 0, EOT: 0, HP: 0, SD: 0 }
        : params.maghribAngle
          ? solveIteratively(date, _coords, params.maghribAngle, 'evening')
          : solvePhenomenonIteratively(date, _coords, 'evening');
      const maghrib = resMaghrib.time;

      const ishaAngle = ishaAngleOverride !== undefined ? ishaAngleOverride : (params.ishaAngle || 18);
      const resIsha = params.ishaInterval
        ? { time: new Date(maghrib.getTime() + params.ishaInterval * 60000), DEC: 0, EOT: 0 }
        : solveIteratively(date, _coords, ishaAngle, 'evening');
      const isha = resIsha.time;

      const resAsr = solveAsrIteratively(date, _coords, asrFactor, { DEC: resTransit.DEC, SD: resTransit.SD }, temperature, pressureMbar);
      const asr = resAsr.time;

      const dhahwaKubra = (isNaN(fajr.getTime()) || isNaN(maghrib.getTime()))
        ? new Date(NaN)
        : new Date((fajr.getTime() + maghrib.getTime()) / 2);

      const results: PrayerTimesResult = {
        fajr, sunrise, dhahwaKubra, dhuhr, asr, maghrib, isha
      };

      if (withMetadata) {
        results.metadata = {
          fajr: { DEC: resFajr.DEC, EOT: resFajr.EOT, angle: params.fajrAngle, iterations: resFajr.iterations },
          sunrise: { DEC: resSunrise.DEC, EOT: resSunrise.EOT, HP: resSunrise.HP, SD: resSunrise.SD, iterations: resSunrise.iterations },
          dhuhr: { DEC: resTransit.DEC, EOT: resTransit.EOT, SD: resTransit.SD, iterations: resTransit.iterations },
          asr: { DEC: resAsr.DEC, EOT: resAsr.EOT, HP: resAsr.HP, SD: resAsr.SD, asrAngle: resAsr.asrAngle, iterations: resAsr.iterations },
          maghrib: { 
            DEC: (resMaghrib as any).DEC ?? 0, 
            EOT: (resMaghrib as any).EOT ?? 0, 
            HP: (resMaghrib as any).HP ?? 0, 
            SD: (resMaghrib as any).SD ?? 0,
            iterations: (resMaghrib as any).iterations ?? 0
          },
          isha: { DEC: resIsha.DEC, EOT: resIsha.EOT, angle: ishaAngle, iterations: (resIsha as any).iterations ?? 0 }
        };
      }

      results.format = function(type: 'iso8601' | 'unix' | '12h' | '24h', timeZone?: string) {
        const formatted: Record<string, string | number> = {};
        const keys: (keyof Omit<PrayerTimesResult, 'format' | 'metadata'>)[] = ['fajr', 'sunrise', 'dhahwaKubra', 'dhuhr', 'asr', 'maghrib', 'isha'];

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
        return formatted as Record<Exclude<keyof PrayerTimesResult, 'format' | 'metadata'>, string | number>;
      };

      if (isNaN(fajr.getTime()) || isNaN(dhuhr.getTime()) || isNaN(maghrib.getTime())) {
        return Failure(ErrorCode.EXTREME_LATITUDE);
      }

      return Success(results);
    }
  };
};

