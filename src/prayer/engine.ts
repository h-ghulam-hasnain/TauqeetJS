/**
 * Core Prayer Time Engine.
 * Modularized and encapsulated using closures for privacy and small footprint.
 */
import { Coordinates, CalculationMethod, PrayerTimesResult, HighLatitudeMethod } from './types/index.js';
import { PRESETS } from './constants/methods.js';
import { Result, Success, Failure, ErrorCode } from '../core/result.js';
import { 
  calculateTransit, 
  solveIteratively, 
  solvePhenomenonIteratively, 
  solveAsrIteratively 
} from './solvers.js';
import { adjustHighLatitudeTimes } from './high-latitude.js';
import { cosd, sind } from '../internal/math.js';

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
      withMetadata: boolean = false,
      highLatitudeMethod?: HighLatitudeMethod
    ): Result<PrayerTimesResult> => {
      const params = PRESETS[_method];
      if (!params) return Failure(`Unknown method: ${_method}`);

      const resTransit = calculateTransit(date, _coords.longitude);

      // Rule 1: Polar Day / Polar Night Absolute Nullification check
      const targetZenith = 90 + 50 / 60; // Sunrise/sunset zenith angle ~90°50'
      const denominator = cosd(_coords.latitude) * cosd(resTransit.DEC);
      let isPolar = false;
      let polarError: ErrorCode | null = null;

      if (Math.abs(denominator) > 1e-10) {
        const cosH = (cosd(targetZenith) - sind(_coords.latitude) * sind(resTransit.DEC)) / denominator;
        if (cosH < -1) {
          isPolar = true;
          polarError = ErrorCode.POLAR_DAY;
        } else if (cosH > 1) {
          isPolar = true;
          polarError = ErrorCode.POLAR_NIGHT;
        }
      } else {
        // Exactly at the poles
        isPolar = true;
        if (_coords.latitude * resTransit.DEC > 0) {
          polarError = ErrorCode.POLAR_DAY;
        } else {
          polarError = ErrorCode.POLAR_NIGHT;
        }
      }

      if (isPolar && polarError) {
        return Failure(polarError);
      }

      const dhuhr = resTransit.time;
      
      const resFajr = solveIteratively(date, _coords, params.fajrAngle, 'morning');
      const fajr = resFajr.time;
      
      const resSunrise = solvePhenomenonIteratively(date, _coords, 'morning');
      const sunrise = resSunrise.time;

      const resMaghrib = params.maghribInterval
        ? { time: new Date(sunrise.getTime() + params.maghribInterval * 60000), DEC: 0, EOT: 0, HP: 0, SD: 0, iterations: 0 }
        : params.maghribAngle
          ? { ...solveIteratively(date, _coords, params.maghribAngle, 'evening'), HP: 0, SD: 0 }
          : solvePhenomenonIteratively(date, _coords, 'evening');
      const maghrib = resMaghrib.time;

      const ishaAngle = ishaAngleOverride !== undefined ? ishaAngleOverride : (params.ishaAngle || 18);
      const resIsha = params.ishaInterval
        ? { time: new Date(maghrib.getTime() + params.ishaInterval * 60000), DEC: 0, EOT: 0, iterations: 0 }
        : solveIteratively(date, _coords, ishaAngle, 'evening');
      const isha = resIsha.time;

      const resAsr = solveAsrIteratively(date, _coords, asrFactor, { DEC: resTransit.DEC, SD: resTransit.SD }, temperature, pressureMbar);
      const asr = resAsr.time;

      const dhahwaKubra = (fajr === null || maghrib === null || isNaN(fajr.getTime()) || isNaN(maghrib.getTime()))
        ? null
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
            DEC: resMaghrib.DEC, 
            EOT: resMaghrib.EOT, 
            HP: resMaghrib.HP, 
            SD: resMaghrib.SD,
            iterations: resMaghrib.iterations
          },
          isha: { DEC: resIsha.DEC, EOT: resIsha.EOT, angle: ishaAngle, iterations: resIsha.iterations }
        };
      }



      let finalFajr: Date | null = fajr;
      let finalSunrise = sunrise;
      let finalDhahwaKubra = dhahwaKubra;
      let finalAsr = asr;
      let finalMaghrib = maghrib;
      let finalIsha: Date | null = isha;

      const hasNaN =
        fajr === null || isNaN(fajr.getTime()) ||
        isNaN(sunrise.getTime()) ||
        dhahwaKubra === null || isNaN(dhahwaKubra.getTime()) ||
        isNaN(dhuhr.getTime()) ||
        isNaN(asr.getTime()) ||
        isNaN(maghrib.getTime()) ||
        isha === null || isNaN(isha.getTime());

      if (hasNaN) {
        const adjResult = adjustHighLatitudeTimes(
          { fajr, sunrise, dhahwaKubra, dhuhr, asr, maghrib, isha },
          _coords,
          highLatitudeMethod,
          resTransit.DEC
        );

        if (!adjResult.success) {
          return Failure(adjResult.error);
        }

        const adjusted = adjResult.data;
        finalFajr = adjusted.fajr;
        finalSunrise = adjusted.sunrise;
        finalDhahwaKubra = adjusted.dhahwaKubra;
        finalAsr = adjusted.asr;
        finalMaghrib = adjusted.maghrib;
        finalIsha = adjusted.isha;

        // Mutate the results object so that any external access see the adjusted values
        results.fajr = finalFajr;
        results.sunrise = finalSunrise;
        results.dhahwaKubra = finalDhahwaKubra;
        results.asr = finalAsr;
        results.maghrib = finalMaghrib;
        results.isha = finalIsha;

        // Re-validate that none are NaN after adjustment (accepting null for fajr, isha, and dhahwaKubra)
        if (
          (finalFajr !== null && isNaN(finalFajr.getTime())) ||
          isNaN(finalSunrise.getTime()) ||
          (finalDhahwaKubra !== null && isNaN(finalDhahwaKubra.getTime())) ||
          isNaN(dhuhr.getTime()) ||
          isNaN(finalAsr.getTime()) ||
          isNaN(finalMaghrib.getTime()) ||
          (finalIsha !== null && isNaN(finalIsha.getTime()))
        ) {
          return Failure(ErrorCode.EXTREME_LATITUDE);
        }
      }

      return Success(results);
    }
  };
};

