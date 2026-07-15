import type { PrayerConfig, UnifiedPrayerTimesResult, DayType, CalculationStrategy } from './types/index.js';
import { validatePrayerConfig } from './validators/validatePrayerConfig.js';
import { calculatePrayerTimesInternal, PrayerCalculationError } from './engine/PrayerEngine.js';
import { classifyLatitude, LatitudeCase } from './engine/LatitudeClassifier.js';
import { calculateDhuhr } from './calculations/Dhuhr.js';

export { resolveTimeZoneSync, PrayerCalculationError } from './engine/PrayerEngine.js';
export { Madhab } from './config/madhabs.js';
export { BUILT_IN_METHODS } from './config/methodRegistry.js';
export * from './formatter/index.js';

export * from './types/index.js';
export * from './types/calendar.js';
export { CalendarService } from './calendars/calendarService.js';

function pad2(n: number) { return n < 10 ? `0${n}` : String(n); }

/**
 * Unified, synchronous single-day prayer calculation function.
 * 
 * @remarks
 * This function encapsulates all astronomical boundary conditions internally
 * (Normal, High-Latitude, Polar Day, and Polar Night). It is highly performant
 * and guaranteed to never throw if the basic configuration validation succeeds.
 */
export function getPrayerTimes(config: PrayerConfig): UnifiedPrayerTimesResult {
  const validation = validatePrayerConfig(config);
  if (!validation.success) {
    throw new PrayerCalculationError(validation.error);
  }
  const vConf = validation.config;

  // Fetch solar transit to evaluate latCase
  const dhuhrTransit = calculateDhuhr(vConf.date, vConf.latitude, vConf.longitude);
  if (!dhuhrTransit) {
    throw new PrayerCalculationError("Solar transit calculation failed.");
  }

  const latCase = classifyLatitude(vConf.latitude, dhuhrTransit.declination, vConf.method.fajrAngle);

  let dayType: DayType = 'NORMAL';
  let appliedStrategy: CalculationStrategy = 'NONE';
  let evaluatedLatitude = vConf.latitude;

  // High-latitude strategy mapping
  const stratMap: Record<string, CalculationStrategy> = {
    'AngleBased': 'ANGLE_BASED',
    'MiddleOfNight': 'MIDDLE_OF_NIGHT',
    'NearestLatitude': 'NEAREST_LATITUDE_FALLBACK',
    'SeventhOfNight': 'SEVENTH_OF_NIGHT'
  };

  if (latCase === LatitudeCase.POLAR_DAY || latCase === LatitudeCase.POLAR_NIGHT) {
    dayType = latCase === LatitudeCase.POLAR_DAY ? 'POLAR_DAY' : 'POLAR_NIGHT';
    appliedStrategy = 'NEAREST_LATITUDE_FALLBACK';
    const sign = vConf.latitude < 0 ? -1 : 1;
    evaluatedLatitude = sign * (vConf.regionalFallbackLatitude ?? 45);
  } else if (latCase === LatitudeCase.CONTINUOUS_TWILIGHT || latCase === LatitudeCase.REGIONAL_FALLBACK) {
    dayType = 'HIGH_LATITUDE';
    appliedStrategy = stratMap[vConf.highLatitudeStrategy] ?? 'MIDDLE_OF_NIGHT';
    if (appliedStrategy === 'NEAREST_LATITUDE_FALLBACK') {
      const sign = vConf.latitude < 0 ? -1 : 1;
      evaluatedLatitude = sign * (vConf.regionalFallbackLatitude ?? 45);
    }
  }

  // Use a modified config reflecting evaluated overrides
  const internalConfig = {
    ...vConf,
    latitude: evaluatedLatitude,
    highLatitudeStrategy: appliedStrategy === 'NEAREST_LATITUDE_FALLBACK' ? 'NearestLatitude' : vConf.highLatitudeStrategy
  };

  // Execute core astronomical pipeline
  const raw = calculatePrayerTimesInternal(internalConfig as any);

  // Ensure we fallback to something if any time is missing
  const fallbackDate = vConf.date.toISOString();

  return {
    date: `${vConf.date.getUTCFullYear()}-${pad2(vConf.date.getUTCMonth() + 1)}-${pad2(vConf.date.getUTCDate())}`,
    times: {
      fajr: raw.fajr.utc || fallbackDate,
      sunrise: raw.sunrise.utc || fallbackDate,
      dhuhr: raw.dhuhr.utc || fallbackDate,
      asr: raw.asr.utc || fallbackDate,
      maghrib: raw.maghrib.utc || fallbackDate,
      isha: raw.isha.utc || fallbackDate,
    },
    metadata: {
      dayType,
      appliedStrategy,
      evaluatedLatitude
    }
  };
}
