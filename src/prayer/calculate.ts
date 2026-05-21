import { createPrayerEngine } from './engine.js';
import { Coordinates, CalculationMethod, PrayerTimesResult, HighLatitudeMethod } from './types/index.js';
import { Result, validateInputs, Failure } from '../core/result.js';

/**
 * Configuration for prayer time calculations.
 */
export interface PrayerConfig {
  /** 
   * Observer coordinates. 
   * Must include latitude (-90 to 90) and longitude (-180 to 180).
   */
  location: Coordinates;
  
  /** 
   * Calculation date. 
   * @default new Date() (Today)
   */
  date?: Date;
  
  /** 
   * Calculation method preset. 
   * Determines Fajr and Isha angles.
   * @default 'Karachi'
   */
  method?: CalculationMethod;
  
  /** 
   * Madhab for Asr calculation. 
   * 'Hanafi' uses shadow factor 2, 'Shafi' uses factor 1.
   * @default 'Hanafi'
   */
  madhab?: 'Shafi' | 'Hanafi';
  
  /** 
   * Elevation in meters above sea level. 
   * Influences Sunrise and Maghrib via atmospheric dip.
   * @default 0
   */
  elevation?: number;
  
  /** 
   * Ambient temperature in Celsius. 
   * Influences atmospheric refraction.
   * @default 10
   */
  temperature?: number;
  
  /** 
   * Atmospheric pressure in mbar (hPa). 
   * Influences atmospheric refraction.
   * @default 1013.25
   */
  pressure?: number;
  /**
   * Manual minute adjustments for each prayer time.
   */
  adjustments?: Partial<Record<Exclude<keyof PrayerTimesResult, 'format' | 'metadata'>, number>>;
  /**
   * Whether to include metadata (astronomical values) in the result.
   */
  withMetadata?: boolean;
  /**
   * Method for high-latitude adjustments (e.g. Nisf al-Layl / Middle of the Night).
   */
  highLatitudeMethod?: HighLatitudeMethod;
}

/**
 * High-level API for calculating prayer times with smart defaults.
 */
export const getPrayerTimes = (config: PrayerConfig): Result<PrayerTimesResult> => {
  const {
    location,
    date = new Date(),
    method = 'Karachi',
    madhab = 'Hanafi',
    elevation = config.location?.elevation ?? 0,
    temperature = 10,
    pressure = 1013.25,
    adjustments = {},
    withMetadata = false,
    highLatitudeMethod
  } = config;

  if (!location) return Failure('Location is required');

  const validation = validateInputs(location.latitude, location.longitude, date);
  if (!validation.success) return validation as any;

  const asrFactor = madhab === 'Hanafi' ? 2 : 1;

  const engine = createPrayerEngine({ ...location, elevation }, method);
  const result = engine.calculate(
    date,
    asrFactor,
    temperature,
    pressure,
    undefined,
    withMetadata,
    highLatitudeMethod
  );

  if (result.success && Object.keys(adjustments).length > 0) {
    const times = result.data;
    const keys = ['fajr', 'sunrise', 'dhahwaKubra', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

    for (const key of keys) {
      const val = times[key];
      if (val !== null && adjustments[key] && !isNaN(val.getTime())) {
        times[key] = new Date(val.getTime() + adjustments[key]! * 60000);
      }
    }
  }

  return result;
};
