import { Coordinates, HighLatitudeMethod } from './types/index.js';
import { Result, Success, Failure, ErrorCode } from '../core/result.js';
import { cosd, sind } from '../internal/math.js';

interface RawTimes {
  fajr: Date | null;
  sunrise: Date;
  dhahwaKubra: Date | null;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date | null;
}

/**
 * Adjusts calculated prayer times for high latitudes where standard geometry fails.
 * Handles astronomical checks for polar day/night, and applies high-latitude methods.
 * 
 * @param times The computed prayer times (which may contain NaNs).
 * @param coords Observer coordinates.
 * @param method The high latitude adjustment method to apply.
 * @param declination The solar declination of the day.
 * @param fajrAngle The angle used for fajr
 * @param ishaAngle The angle used for isha
 */
export function adjustHighLatitudeTimes(
  times: RawTimes,
  coords: Coordinates,
  method: HighLatitudeMethod | undefined,
  declination: number,
  fajrAngle: number,
  ishaAngle: number
): Result<RawTimes, ErrorCode> {
  // 1. Astronomical check for Polar conditions
  const targetZenith = 90 + 50 / 60; // Sunrise/sunset zenith angle ~90°50'
  const denominator = cosd(coords.latitude) * cosd(declination);

  if (Math.abs(denominator) > 1e-10) {
    const cosH = (cosd(targetZenith) - sind(coords.latitude) * sind(declination)) / denominator;
    if (cosH < -1) {
      return Failure(ErrorCode.POLAR_DAY);
    }
    if (cosH > 1) {
      return Failure(ErrorCode.POLAR_NIGHT);
    }
  } else {
    // Exactly at the poles
    if (coords.latitude * declination > 0) {
      return Failure(ErrorCode.POLAR_DAY);
    } else {
      return Failure(ErrorCode.POLAR_NIGHT);
    }
  }

  const adjusted: RawTimes = {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhahwaKubra: times.dhahwaKubra,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha
  };

  // Fallback safe sunrise and maghrib if they are NaN (which should be rare since we ruled out polar conditions)
  const safeSunrise = isNaN(times.sunrise.getTime())
    ? new Date(times.dhuhr.getTime() - 6 * 60 * 60 * 1000)
    : times.sunrise;

  const safeMaghrib = isNaN(times.maghrib.getTime())
    ? new Date(times.dhuhr.getTime() + 6 * 60 * 60 * 1000)
    : times.maghrib;

  // Overwrite sunrise and maghrib in the adjusted object if they were NaN
  if (isNaN(adjusted.sunrise.getTime())) {
    adjusted.sunrise = safeSunrise;
  }
  if (isNaN(adjusted.maghrib.getTime())) {
    adjusted.maghrib = safeMaghrib;
  }

  // Calculate night duration safely
  let sunriseTime = safeSunrise.getTime();
  if (sunriseTime < safeMaghrib.getTime()) {
    sunriseTime += 24 * 60 * 60 * 1000;
  }
  const nightDuration = sunriseTime - safeMaghrib.getTime();

  if (method === HighLatitudeMethod.MIDDLE_OF_THE_NIGHT) {
    const halfNight = nightDuration / 2;

    if (times.fajr === null || isNaN(times.fajr.getTime()) || times.fajr.getTime() < safeSunrise.getTime() - halfNight) {
      adjusted.fajr = new Date(safeSunrise.getTime() - halfNight);
    }
    if (times.isha === null || isNaN(times.isha.getTime()) || times.isha.getTime() > safeMaghrib.getTime() + halfNight) {
      adjusted.isha = new Date(safeMaghrib.getTime() + halfNight);
    }
  } else if (method === HighLatitudeMethod.SEVENTH_OF_THE_NIGHT) {
    const seventhNight = nightDuration / 7;

    if (times.fajr === null || isNaN(times.fajr.getTime()) || times.fajr.getTime() < safeSunrise.getTime() - seventhNight) {
      adjusted.fajr = new Date(safeSunrise.getTime() - seventhNight);
    }
    if (times.isha === null || isNaN(times.isha.getTime()) || times.isha.getTime() > safeMaghrib.getTime() + seventhNight) {
      adjusted.isha = new Date(safeMaghrib.getTime() + seventhNight);
    }
  } else if (method === HighLatitudeMethod.ANGLE_BASED) {
    const fajrPortion = nightDuration * (fajrAngle / 60);
    const ishaPortion = nightDuration * (ishaAngle / 60);

    if (times.fajr === null || isNaN(times.fajr.getTime()) || times.fajr.getTime() < safeSunrise.getTime() - fajrPortion) {
      adjusted.fajr = new Date(safeSunrise.getTime() - fajrPortion);
    }
    if (times.isha === null || isNaN(times.isha.getTime()) || times.isha.getTime() > safeMaghrib.getTime() + ishaPortion) {
      adjusted.isha = new Date(safeMaghrib.getTime() + ishaPortion);
    }
  } else {
    // Default fallback: Conditional "No Isha / Fajr at Midnight" logic
    if (times.fajr === null || isNaN(times.fajr.getTime()) || times.isha === null || isNaN(times.isha.getTime())) {
      adjusted.isha = null;
      // fajr strictly to Midnight of that night (midpoint between Maghrib and next day's Sunrise)
      adjusted.fajr = new Date(safeMaghrib.getTime() + nightDuration / 2);
    }
  }

  // Asr fallback: midpoint between Dhuhr and Maghrib if Asr is NaN or out of logical bounds
  if (
    isNaN(times.asr.getTime()) ||
    times.asr.getTime() < times.dhuhr.getTime() ||
    times.asr.getTime() > safeMaghrib.getTime()
  ) {
    adjusted.asr = new Date((times.dhuhr.getTime() + safeMaghrib.getTime()) / 2);
  }

  // Recalculate Dhahwa Kubra using the adjusted Fajr and Maghrib
  if (adjusted.fajr !== null && adjusted.maghrib !== null && !isNaN(adjusted.fajr.getTime()) && !isNaN(adjusted.maghrib.getTime())) {
    adjusted.dhahwaKubra = new Date((adjusted.fajr.getTime() + adjusted.maghrib.getTime()) / 2);
  } else {
    adjusted.dhahwaKubra = null;
  }

  return Success(adjusted);
}
