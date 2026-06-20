import type { PrayerTimesResult, TimeField, PrayerStatus, PrayerMetadata } from '../types/index.js';
import type { ValidatedPrayerConfig } from '../validators/validatePrayerConfig.js';
import { classifyLatitude, LatitudeCase } from './LatitudeClassifier.js';
import { ASR_SHADOW_FACTOR } from '../config/madhabs.js';
import { calculateDhuhr } from '../calculations/Dhuhr.js';
import { calculateFajr } from '../calculations/Fajr.js';
import { calculateSunrise } from '../calculations/Sunrise.js';
import { calculateAsr } from '../calculations/Asr.js';
import { calculateMaghrib, calculateSunset } from '../calculations/Maghrib.js';
import { calculateIsha } from '../calculations/Isha.js';
import { calculateAstronomicalMidnight } from '../calculations/AstronomicalMidnight.js';
import type { IterativeSolverResult } from '../solvers/IterativeSolver.js';

export class PrayerCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrayerCalculationError';
  }
}

/**
 * Resolves the timezone cascade.
 */
export function resolveTimeZoneSync(explicitTimeZone?: string | number): string | number {
  if (explicitTimeZone !== undefined && explicitTimeZone !== null) {
    return explicitTimeZone;
  }
  if (typeof Intl !== 'undefined') {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      // Fallback
    }
  }
  return 'UTC';
}

/**
 * Formats a raw Date object into a TimeField.
 */
export function formatTimeField(
  val: Date | null,
  status: PrayerStatus,
  timeZone: string | number,
  adjustmentMinutes: number
): TimeField {
  if (!val || isNaN(val.getTime())) {
    return {
      utc: null,
      local: null,
      timestamp: null,
      status,
    };
  }

  const adjusted = new Date(val.getTime() + adjustmentMinutes * 60 * 1000);
  const rounded = new Date(Math.round(adjusted.getTime() / 1000) * 1000);

  let local: string | null = null;
  try {
    if (typeof timeZone === 'number') {
      local = formatManualOffset(rounded, timeZone);
    } else {
      const parsedOffset = parseFloat(timeZone);
      if (!isNaN(parsedOffset) && String(parsedOffset) === timeZone) {
        local = formatManualOffset(rounded, parsedOffset);
      } else {
        local = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone,
        }).format(rounded);
      }
    }
  } catch (e) {
    if (typeof timeZone === 'string') {
      const parsedOffset = parseFloat(timeZone);
      if (!isNaN(parsedOffset)) {
        local = formatManualOffset(rounded, parsedOffset);
      }
    }
    if (!local) {
      local = rounded.toISOString();
    }
  }

  return {
    utc: rounded.toISOString(),
    local,
    timestamp: Math.round(rounded.getTime() / 1000),
    status,
  };
}

function formatManualOffset(date: Date, offsetHours: number): string {
  const localTime = new Date(date.getTime() + offsetHours * 3600000);
  const hours = localTime.getUTCHours();
  const minutes = localTime.getUTCMinutes();
  const seconds = localTime.getUTCSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(displayHours)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
}

/**
 * Solves raw prayer times for a validated config on a specific latitude.
 */
function calculateRawTimes(
  config: ValidatedPrayerConfig,
  latToUse: number
): {
  fajr: { time: Date | null; status: PrayerStatus; metadata: IterativeSolverResult | null };
  sunrise: { time: Date | null; status: PrayerStatus; metadata: IterativeSolverResult | null };
  dhahwaKubra: { time: Date | null; status: PrayerStatus; metadata: null };
  dhuhr: { time: Date | null; status: PrayerStatus; metadata: IterativeSolverResult | null };
  asr: { time: Date | null; status: PrayerStatus; metadata: IterativeSolverResult | null };
  maghrib: { time: Date | null; status: PrayerStatus; metadata: IterativeSolverResult | null };
  isha: { time: Date | null; status: PrayerStatus; metadata: IterativeSolverResult | null };
  sunsetRaw: IterativeSolverResult | null;
} {
  const { date, longitude, method, madhab, elevationMeters, temperatureC, pressureMbar } = config;
  const sf = ASR_SHADOW_FACTOR[madhab];

  // 1. Dhuhr (Transit)
  const dhuhrRes = calculateDhuhr(date, latToUse, longitude);
  if (!dhuhrRes) {
    throw new PrayerCalculationError('Failed to calculate solar transit');
  }

  // 2. Classify Latitude Case
  const latCase = classifyLatitude(latToUse, dhuhrRes.declination, method.fajrAngle);

  // Initialize raw structure
  let fajrTime: Date | null = null;
  let sunriseTime: Date | null = null;
  const dhuhrTime: Date = dhuhrRes.time;
  let asrTime: Date | null = null;
  let maghribTime: Date | null = null;
  let ishaTime: Date | null = null;

  let fajrStatus: PrayerStatus = 'SUCCESS';
  let sunriseStatus: PrayerStatus = 'SUCCESS';
  const dhuhrStatus: PrayerStatus = 'SUCCESS';
  let asrStatus: PrayerStatus = 'SUCCESS';
  let maghribStatus: PrayerStatus = 'SUCCESS';
  let ishaStatus: PrayerStatus = 'SUCCESS';

  let resFajr: any = null;
  let resSunrise: any = null;
  let resSunset: any = null;
  let resAsr: any = null;
  let resMaghrib: any = null;
  let resIsha: any = null;

  if (latCase === LatitudeCase.POLAR_NIGHT) {
    fajrStatus = 'POLAR_NIGHT';
    sunriseStatus = 'POLAR_NIGHT';
    asrStatus = 'POLAR_NIGHT';
    maghribStatus = 'POLAR_NIGHT';
    ishaStatus = 'POLAR_NIGHT';
  } else if (latCase === LatitudeCase.POLAR_DAY) {
    fajrStatus = 'POLAR_DAY';
    sunriseStatus = 'POLAR_DAY';
    maghribStatus = 'POLAR_DAY';
    ishaStatus = 'POLAR_DAY';

    // Asr evaluated dynamically based on diurnal shadow-ratio curve at transit
    resAsr = calculateAsr(
      date,
      latToUse,
      longitude,
      sf,
      dhuhrRes.declination,
      dhuhrRes.semidiameter,
      temperatureC,
      pressureMbar
    );
    if (resAsr) {
      asrTime = resAsr.time;
      asrStatus = 'SUCCESS';
    } else {
      asrStatus = 'POLAR_DAY';
    }
  } else {
    // Normal or Continuous Twilight
    resFajr = calculateFajr(date, latToUse, longitude, method);
    resSunrise = calculateSunrise(
      date,
      latToUse,
      longitude,
      elevationMeters,
      temperatureC,
      pressureMbar
    );
    resSunset = calculateSunset(
      date,
      latToUse,
      longitude,
      elevationMeters,
      temperatureC,
      pressureMbar
    );
    resMaghrib = calculateMaghrib(
      date,
      latToUse,
      longitude,
      elevationMeters,
      temperatureC,
      pressureMbar,
      method,
      resSunset
    );
    resAsr = calculateAsr(
      date,
      latToUse,
      longitude,
      sf,
      dhuhrRes.declination,
      dhuhrRes.semidiameter,
      temperatureC,
      pressureMbar
    );
    resIsha = calculateIsha(date, latToUse, longitude, method, resMaghrib);

    // Assign solved times if available
    fajrTime = resFajr?.time ?? null;
    sunriseTime = resSunrise?.time ?? null;
    asrTime = resAsr?.time ?? null;
    maghribTime = resMaghrib?.time ?? null;
    ishaTime = resIsha?.time ?? null;

    if (latCase === LatitudeCase.CONTINUOUS_TWILIGHT) {
      // ── High-Latitude Fajr / Isha — 4-Case Logic ──────────────────────
      const fajrValid = !!fajrTime && !isNaN(fajrTime.getTime());
      const ishaValid = !!ishaTime && !isNaN(ishaTime.getTime());

      if (fajrValid && ishaValid) {
        // Case 1: Both calculable — keep as-is, no overrides needed.
      } else if (!fajrValid && ishaValid) {
        // Case 2: Isha calculable, Fajr not → Fajr = Astronomical Midnight
        const midnight = calculateAstronomicalMidnight(
          date,
          latToUse,
          longitude,
          elevationMeters,
          temperatureC,
          pressureMbar
        );
        fajrTime = midnight;
        fajrStatus = midnight ? 'ASTRONOMICAL_MIDNIGHT' : 'CONTINUOUS_TWILIGHT';
        resFajr = null;
      } else if (fajrValid && !ishaValid) {
        // Case 3: Fajr calculable, Isha not → Isha = null
        ishaTime = null;
        ishaStatus = 'CONTINUOUS_TWILIGHT';
        resIsha = null;
      } else {
        // Case 4: Neither calculable → Fajr = Astronomical Midnight, Isha = null
        const midnight = calculateAstronomicalMidnight(
          date,
          latToUse,
          longitude,
          elevationMeters,
          temperatureC,
          pressureMbar
        );
        fajrTime = midnight;
        fajrStatus = midnight ? 'ASTRONOMICAL_MIDNIGHT' : 'CONTINUOUS_TWILIGHT';
        resFajr = null;
        ishaTime = null;
        ishaStatus = 'CONTINUOUS_TWILIGHT';
        resIsha = null;
      }

      // Asr fallback if it failed to converge
      if (!asrTime || isNaN(asrTime.getTime())) {
        const safeSunset = resSunset ? resSunset.time : new Date(dhuhrTime.getTime() + 6 * 3600000);
        asrTime = new Date((dhuhrTime.getTime() + safeSunset.getTime()) / 2);
        asrStatus = 'CONTINUOUS_TWILIGHT';
      }
    }
  }

  // Dhahwa Kubra: Midpoint between Fajr and Maghrib (Sunset)
  let dhahwaKubraTime: Date | null = null;
  let dhahwaKubraStatus: PrayerStatus = 'SUCCESS';

  if (latCase === LatitudeCase.POLAR_NIGHT) {
    dhahwaKubraStatus = 'POLAR_NIGHT';
  } else if (latCase === LatitudeCase.POLAR_DAY) {
    dhahwaKubraStatus = 'POLAR_DAY';
  } else {
    const sunsetRef = resSunset ? resSunset.time : maghribTime;
    if (fajrTime && sunsetRef && !isNaN(fajrTime.getTime()) && !isNaN(sunsetRef.getTime())) {
      dhahwaKubraTime = new Date((fajrTime.getTime() + sunsetRef.getTime()) / 2);
    } else {
      dhahwaKubraStatus = 'CONTINUOUS_TWILIGHT';
    }
  }

  return {
    fajr: { time: fajrTime, status: fajrStatus, metadata: resFajr },
    sunrise: { time: sunriseTime, status: sunriseStatus, metadata: resSunrise },
    dhahwaKubra: { time: dhahwaKubraTime, status: dhahwaKubraStatus, metadata: null },
    dhuhr: { time: dhuhrTime, status: dhuhrStatus, metadata: dhuhrRes },
    asr: { time: asrTime, status: asrStatus, metadata: resAsr },
    maghrib: { time: maghribTime, status: maghribStatus, metadata: resMaghrib },
    isha: { time: ishaTime, status: ishaStatus, metadata: resIsha },
    sunsetRaw: resSunset,
  };
}

/**
 * Core engine orchestrator that calculates prayer times.
 */
export function calculatePrayerTimesInternal(config: ValidatedPrayerConfig): PrayerTimesResult {
  const { latitude, longitude, method, highLatitudeStrategy, adjustments } = config;

  // Check if we should run Case 5 (REGIONAL_FALLBACK)
  const dhuhrTransit = calculateDhuhr(config.date, latitude, longitude);
  let latCase = LatitudeCase.NORMAL;
  if (dhuhrTransit) {
    latCase = classifyLatitude(latitude, dhuhrTransit.declination, method.fajrAngle);
  }

  const useFallback =
    latCase === LatitudeCase.REGIONAL_FALLBACK ||
    ((latCase === LatitudeCase.POLAR_NIGHT || latCase === LatitudeCase.POLAR_DAY) &&
      highLatitudeStrategy === 'NearestLatitude');

  let rawResults: ReturnType<typeof calculateRawTimes>;

  if (useFallback) {
    const sign = latitude < 0 ? -1 : 1;
    const anchorLat = sign * config.regionalFallbackLatitude;
    rawResults = calculateRawTimes(config, anchorLat);
  } else {
    rawResults = calculateRawTimes(config, latitude);
  }

  // Format outputs into TimeFields
  const timeZone = config.timeZone;
  const resolveStatus = (fieldStatus: PrayerStatus) => {
    return useFallback ? 'REGIONAL_FALLBACK' : fieldStatus;
  };

  const result: PrayerTimesResult = {
    fajr: formatTimeField(
      rawResults.fajr.time,
      resolveStatus(rawResults.fajr.status),
      timeZone,
      adjustments.fajr
    ),
    sunrise: formatTimeField(
      rawResults.sunrise.time,
      resolveStatus(rawResults.sunrise.status),
      timeZone,
      adjustments.sunrise
    ),
    dhahwaKubra: formatTimeField(
      rawResults.dhahwaKubra.time,
      resolveStatus(rawResults.dhahwaKubra.status),
      timeZone,
      adjustments.dhahwaKubra
    ),
    dhuhr: formatTimeField(
      rawResults.dhuhr.time,
      resolveStatus(rawResults.dhuhr.status),
      timeZone,
      adjustments.dhuhr
    ),
    asr: formatTimeField(
      rawResults.asr.time,
      resolveStatus(rawResults.asr.status),
      timeZone,
      adjustments.asr
    ),
    maghrib: formatTimeField(
      rawResults.maghrib.time,
      resolveStatus(rawResults.maghrib.status),
      timeZone,
      adjustments.maghrib
    ),
    isha: formatTimeField(
      rawResults.isha.time,
      resolveStatus(rawResults.isha.status),
      timeZone,
      adjustments.isha
    ),
  };

  if (config.withMetadata) {
    const meta: PrayerMetadata = {};

    if (rawResults.fajr.metadata) {
      (meta as any).fajr = {
        DEC: rawResults.fajr.metadata.declination,
        EOT: rawResults.fajr.metadata.equationOfTime,
        angle: method.fajrAngle,
        iterations: rawResults.fajr.metadata.iterations,
      };
    }
    if (rawResults.sunrise.metadata) {
      (meta as any).sunrise = {
        DEC: rawResults.sunrise.metadata.declination,
        EOT: rawResults.sunrise.metadata.equationOfTime,
        HP: rawResults.sunrise.metadata.horizontalParallax,
        SD: rawResults.sunrise.metadata.semidiameter,
        iterations: rawResults.sunrise.metadata.iterations,
      };
    }
    if (rawResults.dhuhr.metadata) {
      (meta as any).dhuhr = {
        DEC: rawResults.dhuhr.metadata.declination,
        EOT: rawResults.dhuhr.metadata.equationOfTime,
        SD: rawResults.dhuhr.metadata.semidiameter,
        iterations: rawResults.dhuhr.metadata.iterations,
      };
    }
    if (rawResults.asr.metadata) {
      (meta as any).asr = {
        DEC: rawResults.asr.metadata.declination,
        EOT: rawResults.asr.metadata.equationOfTime,
        HP: rawResults.asr.metadata.horizontalParallax,
        SD: rawResults.asr.metadata.semidiameter,
        iterations: rawResults.asr.metadata.iterations,
      };
    }
    if (rawResults.maghrib.metadata) {
      (meta as any).maghrib = {
        DEC: rawResults.maghrib.metadata.declination,
        EOT: rawResults.maghrib.metadata.equationOfTime,
        HP: rawResults.maghrib.metadata.horizontalParallax,
        SD: rawResults.maghrib.metadata.semidiameter,
        iterations: rawResults.maghrib.metadata.iterations,
      };
    }
    if (rawResults.isha.metadata) {
      const ishaMeta: any = {
        DEC: rawResults.isha.metadata.declination,
        EOT: rawResults.isha.metadata.equationOfTime,
        iterations: rawResults.isha.metadata.iterations,
      };
      if (method.ishaAngle !== null && method.ishaAngle !== undefined) {
        ishaMeta.angle = method.ishaAngle;
      }
      (meta as any).isha = ishaMeta;
    }

    (result as any).metadata = meta;
  }

  return result;
}
