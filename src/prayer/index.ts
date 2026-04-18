import { Coordinates, CalculationMethod, PrayerTimesResult } from './types.js';
import { PrayerEngine } from './engine.js';

export * from './types.js';
export * from './engine.js';

/**
 * High-level configuration for the library.
 */
export interface PrayerConfig {
  date?: Date;
  location: Coordinates;
  method?: CalculationMethod;
  madhab?: 'Shafi' | 'Hanafi';
  elevation?: number; // Overrides location.elevation
  elevationUnit?: 'm' | 'ft'; // Default: 'm'
}

/**
 * Calculates prayer times. Supports both a config object or positional arguments for extreme simplicity.
 * 
 * positional: getPrayerTimes(lat, lng, method?, madhab?, date?, elevation?)
 * object: getPrayerTimes({ location: { lat, lng }, method: 'Karachi' })
 */
export function getPrayerTimes(
  arg1: PrayerConfig | number,
  arg2?: number,
  arg3?: CalculationMethod,
  arg4?: 'Hanafi' | 'Shafi' | number, // Madhab or Asr Factor
  arg5?: Date,
  arg6?: number // Elevation in meters (default) or feet if specified in config
): PrayerTimesResult {
  let config: PrayerConfig;

  if (typeof arg1 === 'number') {
    // Positional arguments
    config = {
      location: { latitude: arg1, longitude: arg2 || 0 },
      method: arg3 || 'Karachi',
      madhab: typeof arg4 === 'number' ? (arg4 === 2 ? 'Hanafi' : 'Shafi') : (arg4 || 'Hanafi'),
      date: arg5 || new Date(),
      elevation: arg6
    };
  } else {
    // Config object
    config = arg1;
  }

  const {
    date = new Date(),
    location,
    method = 'Karachi',
    madhab = 'Hanafi',
    elevation = config.location.elevation || 0,
    elevationUnit = 'm'
  } = config;

  // Convert elevation to meters if it's in feet
  const elevationMeters = elevationUnit === 'ft' ? elevation * 0.3048 : elevation;

  const engine = new PrayerEngine({ ...location, elevation: elevationMeters }, method);
  const factor = madhab === 'Hanafi' ? 2 : 1;
  
  return engine.calculate(date, factor);
}
