import { createPrayerEngine } from './engine.js';
import { Coordinates, CalculationMethod, PrayerTimesResult } from './types/index.js';
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
   * Useful for matching local mosque timings or applying safety margins.
   */
  adjustments?: Partial<Record<Exclude<keyof PrayerTimesResult, 'format'>, number>>;
}

/**
 * High-level API for calculating prayer times with smart defaults.
 * Follows the Result Pattern to ensure host stability.
 * 
 * @example
 * const result = getPrayerTimes({ location: { latitude: 24.86, longitude: 67.01 } });
 * if (result.success) {
 *   console.log(result.data.fajr);
 * } else {
 *   console.error(result.error);
 * }
 */
export const getPrayerTimes = (config: PrayerConfig): Result<PrayerTimesResult> => {
  // Apply smart defaults
  const {
    location,
    date = new Date(),
    method = 'Karachi',
    madhab = 'Hanafi',
    elevation = config.location?.elevation ?? 0,
    temperature = 10,
    pressure = 1013.25,
    adjustments = {}
  } = config;

  if (!location) return Failure('Location is required');

  // Input Validation: Returns Failure instead of throwing
  const validation = validateInputs(location.latitude, location.longitude, date);
  if (!validation.success) return validation as any;

  // Internal Logic Conversions
  const asrFactor = madhab === 'Hanafi' ? 2 : 1;
  const ishaAngle = madhab === 'Hanafi' ? 18 : 12;

  try {
    const engine = createPrayerEngine({ ...location, elevation }, method);
    const result = engine.calculate(date, asrFactor, temperature, pressure, ishaAngle);
    
    if (result.success && Object.keys(adjustments).length > 0) {
      const times = result.data;
      const keys = ['fajr', 'sunrise', 'dhahwaKubra', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
      
      for (const key of keys) {
        if (adjustments[key] && !isNaN(times[key].getTime())) {
          times[key] = new Date(times[key].getTime() + adjustments[key]! * 60000);
        }
      }
    }
    
    return result;
  } catch (e) {
    return Failure(e instanceof Error ? e.message : 'Unknown error during calculation');
  }
};
