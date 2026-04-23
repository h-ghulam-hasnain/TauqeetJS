import { Coordinates, CalculationMethod, PrayerTimesResult } from './types.js';
import { PrayerEngine } from './engine.js';

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
  temperature?: number; // Atmospheric temperature in °C
  pressure?: number; // Atmospheric pressure value
  pressureUnit?: 'kPa' | 'mbar'; // Default: 'kPa'
}

/**
 * Validates prayer calculation inputs.
 */
function validateInputs(config: PrayerConfig): void {
  const { location, temperature, pressure } = config;

  if (location.latitude < -90 || location.latitude > 90) {
    throw new Error(`Invalid latitude: ${location.latitude}. Must be between -90 and 90.`);
  }
  if (location.longitude < -180 || location.longitude > 180) {
    throw new Error(`Invalid longitude: ${location.longitude}. Must be between -180 and 180.`);
  }

  if (temperature !== undefined && (temperature < -100 || temperature > 100)) {
    throw new Error(`Invalid temperature: ${temperature}°C. Must be between -100 and 100.`);
  }

  if (pressure !== undefined && pressure < 0) {
    throw new Error(`Invalid pressure: ${pressure}. Must be non-negative.`);
  }
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

  try {
    const {
      location,
      date = new Date(),
      method = 'Karachi',
      madhab = 'Hanafi',
      elevation = config.location.elevation || 0,
      elevationUnit = 'm',
      temperature = 10,
      pressure = 101.0,
      pressureUnit = 'kPa'
    } = config;

    if (!location) {
      throw new Error('Location is required in PrayerConfig.');
    }

    validateInputs(config);

    // Convert elevation to meters if it's in feet
    const elevationMeters = elevationUnit === 'ft' ? elevation * 0.3048 : elevation;

  // Internal pressure unit is mbar (1 kPa = 10 mbar)
  const pressureMbar = pressureUnit === 'kPa' ? pressure * 10 : pressure;

  const engine = new PrayerEngine({ ...location, elevation: elevationMeters }, method);
  const factor = madhab === 'Hanafi' ? 2 : 1;

  return engine.calculate(date, factor, temperature, pressureMbar);
  } catch (error) {
    console.error('--- PRAYER CALCULATION ERROR ---');
    console.error(error);
    
    // Return empty results to prevent caller crashes
    const invalid = new Date(NaN);
    return {
      fajr: invalid,
      sunrise: invalid,
      dhahwaKubra: invalid,
      dhuhr: invalid,
      asr: invalid,
      maghrib: invalid,
      isha: invalid
    };
  }
}
