import { getSunset } from '../utils/sunset.js';
import {
  computeLunarPosition,
  computeLunarPhase,
  dateToJulianDay,
  calculateDeltaT,
  computePreviousNewMoon,
} from '../../astronomy/index.js';
import { VisibilityMethod } from '../types/MoonVisibility.js';
import type { VisibilityInput, VisibilityResult } from '../types/MoonVisibility.js';
import type { VisibilityCriterion } from './VisibilityCriteria.js';
import { OdehCriterion } from './OdehCriterion.js';
import { YallopCriterion } from './YallopCriterion.js';
import { HMNAOCriterion } from './HMNAOCriterion.js';

export interface CheckVisibilityParams {
  date: Date;
  latitude: number;
  longitude: number;
  elevation?: number;
  method: VisibilityMethod;
}

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function sind(deg: number) {
  return Math.sin(deg * D2R);
}
function cosd(deg: number) {
  return Math.cos(deg * D2R);
}
function asind(val: number) {
  return Math.asin(val) * R2D;
}

/**
 * Main engine to check moon visibility at a given date and location.
 */
export function checkVisibility(params: CheckVisibilityParams): VisibilityResult {
  const input = buildVisibilityInput(params.date, params.latitude, params.longitude);
  if (!input) {
    return {
      criterionName: params.method,
      visible: false,
      details: { error: 'Sun does not set on this date at this location.' },
    };
  }

  const criterion = getCriterionInstance(params.method);
  return criterion.evaluate(input);
}

/**
 * Checks multiple criteria at once.
 */
export function checkMultipleCriteria(
  params: Omit<CheckVisibilityParams, 'method'>
): VisibilityResult[] {
  const input = buildVisibilityInput(params.date, params.latitude, params.longitude);
  if (!input) {
    return [];
  }

  return [
    new OdehCriterion().evaluate(input),
    new YallopCriterion().evaluate(input),
    new HMNAOCriterion().evaluate(input),
  ];
}

function getCriterionInstance(method: VisibilityMethod): VisibilityCriterion {
  switch (method) {
    case VisibilityMethod.ODEH:
      return new OdehCriterion();
    case VisibilityMethod.YALLOP:
      return new YallopCriterion();
    case VisibilityMethod.HMNAO:
      return new HMNAOCriterion();
    default:
      return new OdehCriterion();
  }
}

function buildVisibilityInput(
  date: Date,
  latitude: number,
  longitude: number
): VisibilityInput | null {
  const sunset = getSunset(date, latitude, longitude);
  if (!sunset) return null; // Polar day/night

  const year = sunset.getUTCFullYear();
  const month = sunset.getUTCMonth() + 1;
  const day = sunset.getUTCDate();
  const ut = sunset.getUTCHours() + sunset.getUTCMinutes() / 60 + sunset.getUTCSeconds() / 3600;

  const j = dateToJulianDay(year, month, day);
  const deltaT = calculateDeltaT(year);

  // Compute Moon position at sunset
  const lunarPos = computeLunarPosition(j, ut, deltaT);
  const lunarPhase = computeLunarPhase(j, ut, deltaT);

  // Approximate altitude: we have RA and Dec.
  // We need LHA = GAST - RA + longitude (wait, LHA = GHA + longitude. Astronomy gives GHA!).
  const lha = lunarPos.gha + longitude;
  const dec = lunarPos.declination;
  const sinAlt = sind(latitude) * sind(dec) + cosd(latitude) * cosd(dec) * cosd(lha);
  const moonAltitudeAtSunset = asind(sinAlt);

  // Approximate Azimuth
  const y = sind(lha);
  const x = cosd(lha) * sind(latitude) - tand(dec) * cosd(latitude); // tand is sin/cos
  const moonAzimuthAtSunset = Math.atan2(y, x) * R2D + 180; // normalized to 0-360

  // Moon age in hours
  const prevNewMoonEvent = computePreviousNewMoon(j + ut / 24, deltaT);
  const prevNewMoonDate = new Date(
    Date.UTC(
      prevNewMoonEvent.year,
      prevNewMoonEvent.month - 1,
      prevNewMoonEvent.day,
      prevNewMoonEvent.hour,
      prevNewMoonEvent.minute,
      prevNewMoonEvent.second
    )
  );

  const moonAgeHours = (sunset.getTime() - prevNewMoonDate.getTime()) / 3600000;

  return {
    sunset,
    moonAltitudeAtSunset,
    moonAzimuthAtSunset,
    elongation: lunarPhase.elongation,
    moonAgeHours,
    arcv: moonAltitudeAtSunset - -0.833, // Sun is at -0.833 at sunset
    arcl: lunarPhase.elongation,
  };
}

function tand(deg: number) {
  return Math.tan(deg * D2R);
}
