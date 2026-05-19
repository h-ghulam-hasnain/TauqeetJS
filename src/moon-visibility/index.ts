/**
 * Moon Visibility Engine.
 * Stateless, functional-modular design for high-precision lunar analytics.
 */

import { Coordinates } from '../prayer/types/index.js';
import { Result, validateInputs, Success, Failure, ErrorCode, ValidationError } from '../core/result.js';
import { getJulianDate, getDeltaT } from '../internal/time.js';
import { calculateMoonEphemeris, calculateMoonAltitude, calculateMoonAzimuth } from './ephemeris.js';
import { calculateDiskAnalytics } from './analytics.js';
import { solveMoonTransit, solveMoonRiseSet, findMoonPhase } from './solvers.js';
import { MoonVisibilityResult, MoonPosition, MoonDiskAnalytics, MoonAlmanac, MoonInput, DateTimeDetails } from './types.js';
import { getPrayerTimes } from '../prayer/calculate.js';

export type { MoonInput, DateTimeDetails, MoonAlmanac, MoonDiskAnalytics, MoonPosition, MoonVisibilityResult };

/**
 * Calculates current lunar position.
 */
export function calculateMoonPosition(date: Date, coords: Coordinates): Result<MoonPosition> {
  const jd = getJulianDate(date);
  const deltaT = getDeltaT(date.getUTCFullYear());
  
  const m = calculateMoonEphemeris(jd, deltaT);
  const altitude = calculateMoonAltitude(m.GHA, m.DEC, coords.latitude, coords.longitude);
  const azimuth = calculateMoonAzimuth(m.GHA, m.DEC, coords.latitude, coords.longitude);

  return Success({
    altitude,
    azimuth,
    rightAscension: m.RA,
    declination: m.DEC,
    gha: m.GHA,
    hp: m.HP,
    sd: m.SD
  });
}

/**
 * Calculates lunar disk analytics (Phase, Illumination, Age).
 */
export function calculateMoonDiskAnalytics(date: Date): Result<MoonDiskAnalytics> {
  const jd = getJulianDate(date);
  const deltaT = getDeltaT(date.getUTCFullYear());
  
  const m = calculateMoonEphemeris(jd, deltaT);
  const analytics = calculateDiskAnalytics(jd, m, deltaT);

  return Success(analytics);
}

/**
 * Calculates predictive lunar almanac (Rise, Set, Phases).
 */
export function calculateMoonAlmanac(date: Date, coords: Coordinates): Result<MoonAlmanac> {
  const dMidnight = new Date(date);
  dMidnight.setUTCHours(0, 0, 0, 0);
  const jdMidnight = getJulianDate(dMidnight);
  const deltaT = getDeltaT(date.getUTCFullYear());
  
  const transitUT = solveMoonTransit(jdMidnight, 12, deltaT, coords.longitude);
  const riseUT = solveMoonRiseSet(jdMidnight, transitUT, deltaT, coords.latitude, coords.longitude, 'rise');
  const setUT = solveMoonRiseSet(jdMidnight, transitUT, deltaT, coords.latitude, coords.longitude, 'set');

  // Phases
  const nextNew = findMoonPhase(jdMidnight - 1, jdMidnight + 30, 0, deltaT);
  const nextFull = findMoonPhase(jdMidnight - 1, jdMidnight + 30, 180, deltaT);
  const prevNew = findMoonPhase(jdMidnight - 30, jdMidnight + 1, 0, deltaT);
  const prevFull = findMoonPhase(jdMidnight - 30, jdMidnight + 1, 180, deltaT);

  const toDate = (jdTime: number) => {
    const d = new Date(Date.UTC(2000, 0, 1));
    d.setUTCMilliseconds((jdTime - 2451544.5) * 86400 * 1000);
    return d;
  };

  const utToDate = (utHours: number | null) => {
    if (utHours === null) return null;
    const d = new Date(dMidnight);
    d.setUTCMilliseconds(utHours * 3600 * 1000);
    return d;
  };

  const roundToNearestSecond = (d: Date): Date => {
    const ms = d.getUTCMilliseconds();
    const rounded = new Date(d);
    rounded.setUTCMilliseconds(0);
    if (ms >= 500) {
      rounded.setUTCSeconds(rounded.getUTCSeconds() + 1);
    }
    return rounded;
  };

  const getUTCDateTimeDetails = (d: Date, julianDay: number): DateTimeDetails => {
    const rounded = roundToNearestSecond(d);
    const year = rounded.getUTCFullYear();
    const month = String(rounded.getUTCMonth() + 1).padStart(2, '0');
    const day = String(rounded.getUTCDate()).padStart(2, '0');
    const hours = String(rounded.getUTCHours()).padStart(2, '0');
    const minutes = String(rounded.getUTCMinutes()).padStart(2, '0');
    const seconds = String(rounded.getUTCSeconds()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}:${seconds}`,
      julianDay
    };
  };

  const riseDate = utToDate(riseUT);
  const setDate = utToDate(setUT);
  const transitDate = utToDate(transitUT);

  const mTransit = calculateMoonEphemeris(jdMidnight + transitUT / 24.0, deltaT);
  const hTransit = calculateMoonAltitude(mTransit.GHA, mTransit.DEC, coords.latitude, coords.longitude);
  const hRefTransit = 0.7275 * mTransit.HP - 0.5667;
  const isAlwaysBelow = hTransit < hRefTransit;

  const riseVal = riseDate
    ? getUTCDateTimeDetails(riseDate, jdMidnight + (riseUT ?? 0) / 24.0)
    : 'Never Rises';
  
  const setVal = setDate
    ? getUTCDateTimeDetails(setDate, jdMidnight + (setUT ?? 0) / 24.0)
    : 'Never Sets';

  const transitVal = transitDate
    ? getUTCDateTimeDetails(transitDate, jdMidnight + transitUT / 24.0)
    : (isAlwaysBelow ? 'Never Rises' : 'Never Sets');

  const nextNewDate = toDate(nextNew);
  const nextFullDate = toDate(nextFull);
  const prevNewDate = toDate(prevNew);
  const prevFullDate = toDate(prevFull);

  const upcomingNewMoon = getUTCDateTimeDetails(nextNewDate, nextNew);
  const upcomingFullMoon = getUTCDateTimeDetails(nextFullDate, nextFull);
  const previousNewMoon = getUTCDateTimeDetails(prevNewDate, prevNew);
  const previousFullMoon = getUTCDateTimeDetails(prevFullDate, prevFull);

  return Success({
    rise: riseVal,
    set: setVal,
    transit: transitVal,
    MoonRise: riseVal,
    MoonSet: setVal,
    LocalTransit: transitVal,
    upcomingNewMoon,
    upcomingFullMoon,
    previousNewMoon,
    previousFullMoon,
    nextNewMoon: upcomingNewMoon,
    nextFullMoon: upcomingFullMoon,
    prevNewMoon: previousNewMoon,
    prevFullMoon: previousFullMoon
  });
}

/**
 * Unified high-level API for Moon Visibility.
 */
export function getMoonVisibility(inputs: MoonInput): Result<MoonVisibilityResult>;
export function getMoonVisibility(date: Date, latitude: number, longitude: number): Result<MoonVisibilityResult>;
export function getMoonVisibility(
  firstArg: Date | MoonInput,
  secondArg?: number,
  thirdArg?: number
): Result<MoonVisibilityResult> {
  let inputs: MoonInput;
  if (firstArg instanceof Date) {
    const hours = String(firstArg.getHours()).padStart(2, '0');
    const minutes = String(firstArg.getMinutes()).padStart(2, '0');
    const seconds = String(firstArg.getSeconds()).padStart(2, '0');
    inputs = {
      date: firstArg,
      latitude: secondArg,
      longitude: thirdArg,
      time: `${hours}:${minutes}:${seconds}`
    };
  } else {
    inputs = firstArg || {};
  }

  const lat = inputs.latitude;
  const lng = inputs.longitude;
  if (lat === undefined || lat === null || lng === undefined || lng === null) {
    return Result.Failure(ValidationError.MISSING_COORDINATES);
  }

  let targetDate = inputs.date ? new Date(inputs.date) : new Date();
  if (isNaN(targetDate.getTime())) {
    return Result.Failure(ErrorCode.INVALID_DATE);
  }

  if (inputs.time !== undefined && inputs.time !== null) {
    const timeStr = String(inputs.time).trim();
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      const ms = timeMatch[4] ? parseInt(timeMatch[4], 10) : 0;
      targetDate.setHours(hours, minutes, seconds, ms);
    } else {
      const parsedTime = Date.parse(`1970-01-01T${timeStr}`);
      if (!isNaN(parsedTime)) {
        const d = new Date(parsedTime);
        targetDate.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
      }
    }
  } else {
    // Sunset Rule
    const prayerRes = getPrayerTimes({
      location: { latitude: lat, longitude: lng },
      date: targetDate
    });
    if (prayerRes.success) {
      targetDate = prayerRes.data.maghrib;
    } else {
      return Result.Failure(ErrorCode.CALCULATION_FAILED);
    }
  }

  const validation = validateInputs(lat, lng, targetDate);
  if (!validation.success) return validation as any;

  const coords = { latitude: lat, longitude: lng };
  
  const positionRes = calculateMoonPosition(targetDate, coords);
  const analyticsRes = calculateMoonDiskAnalytics(targetDate);
  const almanacRes = calculateMoonAlmanac(targetDate, coords);

  if (positionRes.success && analyticsRes.success && almanacRes.success) {
    return Success({
      position: positionRes.data,
      analytics: analyticsRes.data,
      almanac: almanacRes.data
    });
  }

  return Failure(ErrorCode.CALCULATION_FAILED);
}

