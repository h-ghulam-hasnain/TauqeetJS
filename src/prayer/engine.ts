/**
 * Core Prayer Time Engine.
 * Modularized and encapsulated using closures for privacy and small footprint.
 */
import { Coordinates, CalculationMethod, HighLatitudeMethod, InternalPrayerTimes, TimeField } from './types/index.js';
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
      pressureMbar: number = 1013.25,
      ishaAngleOverride?: number,
      withMetadata: boolean = false,
      highLatitudeMethod?: HighLatitudeMethod
    ): Result<InternalPrayerTimes> => {
      const params = PRESETS[_method as keyof typeof PRESETS];
      if (!params) return Failure(`Unknown method: ${_method}`);

      const resTransit = calculateTransit(date, _coords.longitude);

      // Rule 1: Polar Day / Polar Night Absolute Nullification check
      const targetZenith = 90 + 50 / 60; // Sunrise/sunset zenith angle ~90°50'
      const denominator = cosd(_coords.latitude) * cosd(resTransit.DEC);
      let isPolar = false;
      let polarStatus: 'POLAR_DAY' | 'POLAR_NIGHT' | null = null;

      if (Math.abs(denominator) > 1e-10) {
        const cosH = (cosd(targetZenith) - sind(_coords.latitude) * sind(resTransit.DEC)) / denominator;
        if (cosH < -1) {
          isPolar = true;
          polarStatus = 'POLAR_DAY';
        } else if (cosH > 1) {
          isPolar = true;
          polarStatus = 'POLAR_NIGHT';
        }
      } else {
        // Exactly at the poles
        isPolar = true;
        if (_coords.latitude * resTransit.DEC > 0) {
          polarStatus = 'POLAR_DAY';
        } else {
          polarStatus = 'POLAR_NIGHT';
        }
      }

      const dhuhr = resTransit.time;
      
      const resFajr = solveIteratively(date, _coords, params.fajrAngle, 'morning');
      const fajr = resFajr.time;
      
      const resSunrise = solvePhenomenonIteratively(date, _coords, 'morning', temperature, pressureMbar);
      const sunrise = resSunrise.time;

      const resSunset = solvePhenomenonIteratively(date, _coords, 'evening', temperature, pressureMbar);
      const maghrib = params.maghribInterval
        ? new Date(resSunset.time.getTime() + params.maghribInterval * 60000)
        : params.maghribAngle
          ? solveIteratively(date, _coords, params.maghribAngle, 'evening').time
          : resSunset.time;

      const resMaghrib = params.maghribInterval
        ? { time: maghrib, DEC: resSunset.DEC, EOT: resSunset.EOT, HP: resSunset.HP, SD: resSunset.SD, iterations: resSunset.iterations }
        : params.maghribAngle
          ? { ...solveIteratively(date, _coords, params.maghribAngle, 'evening'), HP: 0, SD: 0 }
          : resSunset;

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

      let isContinuousTwilight = false;

      if (hasNaN && !isPolar) {
        isContinuousTwilight = true;
        const adjResult = adjustHighLatitudeTimes(
          { fajr, sunrise, dhahwaKubra, dhuhr, asr, maghrib, isha },
          _coords,
          highLatitudeMethod,
          resTransit.DEC,
          params.fajrAngle,
          ishaAngle
        );

        if (!adjResult.success) {
          isPolar = true;
          polarStatus = adjResult.error as 'POLAR_DAY' | 'POLAR_NIGHT';
        } else {
          const adjusted = adjResult.data;
          finalFajr = adjusted.fajr;
          finalSunrise = adjusted.sunrise;
          finalDhahwaKubra = adjusted.dhahwaKubra;
          finalAsr = adjusted.asr;
          finalMaghrib = adjusted.maghrib;
          finalIsha = adjusted.isha;
        }
      }

      if (isPolar) {
        finalFajr = null;
        finalSunrise = new Date(NaN);
        finalDhahwaKubra = null;
        finalMaghrib = new Date(NaN);
        finalIsha = null;
      }

      const getStatus = (d: Date | null, isFajrOrIsha = false): TimeField['status'] => {
        if (isPolar) return polarStatus!;
        if (d === null || isNaN(d.getTime())) return isFajrOrIsha ? 'NO_TIME_FOR_ISHA' : 'CONTINUOUS_TWILIGHT';
        return isContinuousTwilight ? 'CONTINUOUS_TWILIGHT' : 'SUCCESS';
      };

      const results: InternalPrayerTimes = {
        fajr: { value: finalFajr, status: getStatus(finalFajr, true) },
        sunrise: { value: finalSunrise, status: getStatus(finalSunrise) },
        dhahwaKubra: { value: finalDhahwaKubra, status: getStatus(finalDhahwaKubra) },
        dhuhr: { value: dhuhr, status: 'SUCCESS' },
        asr: { value: finalAsr, status: isNaN(finalAsr.getTime()) ? (isPolar ? polarStatus! : 'CONTINUOUS_TWILIGHT') : 'SUCCESS' },
        maghrib: { value: finalMaghrib, status: getStatus(finalMaghrib) },
        isha: { value: finalIsha, status: getStatus(finalIsha, true) }
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
            HP: 'HP' in resMaghrib ? resMaghrib.HP : 0, 
            SD: 'SD' in resMaghrib ? resMaghrib.SD : 0,
            iterations: resMaghrib.iterations
          },
          isha: { DEC: resIsha.DEC, EOT: resIsha.EOT, angle: ishaAngle, iterations: resIsha.iterations }
        };
      }

      return Success(results);
    }
  };
};
