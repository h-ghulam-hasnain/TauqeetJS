import type { PrayerConfig, CoordinateInput, ElevationInput, PrayerMethodConfig } from '../types/index.js';
import { BUILT_IN_METHODS } from '../config/methodRegistry.js';
import { Madhab } from '../config/madhabs.js';

export interface ValidatedPrayerConfig {
  readonly latitude: number;
  readonly longitude: number;
  readonly date: Date;
  readonly timeZone: string | number;
  readonly method: PrayerMethodConfig;
  readonly madhab: Madhab;
  readonly elevationMeters: number;
  readonly temperatureC: number;
  readonly pressureMbar: number;
  readonly resolveTimezoneAsync?: (lat: number, lon: number) => Promise<string> | string;
  readonly adjustments: Record<'fajr' | 'sunrise' | 'dhahwaKubra' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number>;
  readonly withMetadata: boolean;
  readonly highLatitudeStrategy: 'AngleBased' | 'MiddleOfNight' | 'SeventhOfNight' | 'NearestLatitude';
  readonly regionalFallbackLatitude: number;
}

function parseCoordinate(input: CoordinateInput | undefined, isLat: boolean): number {
  if (input === undefined || input === null) return NaN;
  if (typeof input === 'number') return input;

  if (typeof input === 'string') {
    const dmsRegex = /^(\d{1,3})[°\s](\d{1,2})['\s](\d{1,2}(?:\.\d+)?)["]\s*([NSEW])$/i;
    const match = input.match(dmsRegex);
    if (!match) return NaN;
    const deg = parseFloat(match[1]!);
    const min = parseFloat(match[2]!);
    const sec = parseFloat(match[3]!);
    const dir = match[4]!.toUpperCase();

    if (isLat && dir !== 'N' && dir !== 'S') return NaN;
    if (!isLat && dir !== 'E' && dir !== 'W') return NaN;

    let val = deg + min / 60 + sec / 3600;
    if (dir === 'S' || dir === 'W') val = -val;
    return val;
  }

  if (typeof input === 'object' && 'degrees' in input && 'minutes' in input && 'seconds' in input && 'direction' in input) {
    const dir = input.direction.toUpperCase();
    if (isLat && dir !== 'N' && dir !== 'S') return NaN;
    if (!isLat && dir !== 'E' && dir !== 'W') return NaN;

    let val = input.degrees + input.minutes / 60 + input.seconds / 3600;
    if (dir === 'S' || dir === 'W') val = -val;
    return val;
  }

  return NaN;
}

function parseDate(dateInput?: Date | number | string): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) throw new Error('Invalid Date object');
    return dateInput;
  }
  if (typeof dateInput === 'number') {
    // If it's a UNIX timestamp in seconds (e.g. less than 10000000000), convert to ms
    const ms = dateInput < 10000000000 ? dateInput * 1000 : dateInput;
    const d = new Date(ms);
    if (isNaN(d.getTime())) throw new Error('Invalid timestamp');
    return d;
  }
  if (typeof dateInput === 'string') {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) throw new Error('Invalid date string');
    return d;
  }
  throw new Error('Unsupported date format');
}

function parseElevation(elev?: number | ElevationInput): number {
  if (elev === undefined || elev === null) return 0;
  if (typeof elev === 'number') {
    if (isNaN(elev)) throw new Error('Elevation cannot be NaN');
    return elev;
  }
  if (typeof elev === 'object' && 'value' in elev && 'unit' in elev) {
    if (typeof elev.value !== 'number' || isNaN(elev.value)) {
      throw new Error('Elevation value must be a number');
    }
    if (elev.unit === 'feet') {
      return elev.value * 0.3048;
    }
    if (elev.unit === 'meters') {
      return elev.value;
    }
  }
  throw new Error('Unsupported elevation format');
}

export type ValidationResult =
  | { success: true; config: ValidatedPrayerConfig }
  | { success: false; error: string };

export function validatePrayerConfig(config: PrayerConfig): ValidationResult {
  try {
    if (!config) {
      return { success: false, error: 'Configuration is required' };
    }

    // Coordinate validation
    const lat = parseCoordinate(config.lat, true);
    const long = parseCoordinate(config.long, false);

    if (lat === undefined || lat === null || isNaN(lat)) {
      return { success: false, error: 'Latitude is missing, null, or NaN' };
    }
    if (long === undefined || long === null || isNaN(long)) {
      return { success: false, error: 'Longitude is missing, null, or NaN' };
    }

    if (lat <= -90 || lat >= 90) {
      return { success: false, error: 'Latitude must be strictly between -90 and +90' };
    }
    if (long <= -180 || long >= 180) {
      return { success: false, error: 'Longitude must be strictly between -180 and +180' };
    }

    // Climatic Boundaries
    const temp = config.temperatureC ?? 10;
    if (typeof temp !== 'number' || isNaN(temp) || temp < -60 || temp > 60) {
      return { success: false, error: 'Temperature must be between -60°C and 60°C' };
    }

    const pressure = config.pressureMbar ?? 1010;
    if (typeof pressure !== 'number' || isNaN(pressure) || !Number.isInteger(pressure) || pressure < 500 || pressure > 1100) {
      return { success: false, error: 'Pressure must be an integer between 500 mbar and 1100 mbar' };
    }

    // Date normalization
    let date: Date;
    try {
      date = parseDate(config.date);
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid date' };
    }

    // TimeZone: fall back to the system timezone when not supplied.
    let timeZone: string | number;
    if (config.timeZone !== undefined && config.timeZone !== null) {
      timeZone = config.timeZone;
    } else {
      try {
        timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        timeZone = 'UTC';
      }
    }

    // Method parsing
    let methodConfig: PrayerMethodConfig;
    if (config.method === undefined) {
      methodConfig = BUILT_IN_METHODS.Karachi!;
    } else if (typeof config.method === 'string') {
      const match = BUILT_IN_METHODS[config.method];
      if (!match) {
        return { success: false, error: `Unknown method preset: ${config.method}` };
      }
      methodConfig = match!;
    } else if (typeof config.method === 'object') {
      const mc = config.method;
      if (typeof mc.id !== 'string' || typeof mc.name !== 'string' || typeof mc.fajrAngle !== 'number' || isNaN(mc.fajrAngle)) {
        return { success: false, error: 'Custom method config is missing required fields' };
      }
      methodConfig = mc;
    } else {
      return { success: false, error: 'Invalid method configuration format' };
    }

    // Madhab
    let madhab: Madhab = Madhab.HANAFI;
    if (config.madhab !== undefined) {
      const mStr = String(config.madhab).toLowerCase();
      if (mStr === 'hanafi') {
        madhab = Madhab.HANAFI;
      } else if (mStr === 'shafi' || mStr === 'shafii') {
        madhab = Madhab.SHAFI;
      } else {
        return { success: false, error: `Invalid madhab: ${config.madhab}` };
      }
    }

    // Elevation
    let elevationMeters: number;
    try {
      elevationMeters = parseElevation(config.elevation);
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid elevation' };
    }

    // Adjustments
    const adjustments: Record<'fajr' | 'sunrise' | 'dhahwaKubra' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number> = {
      fajr: 0,
      sunrise: 0,
      dhahwaKubra: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
    };
    if (config.adjustments) {
      for (const key of Object.keys(adjustments) as Array<keyof typeof adjustments>) {
        if (config.adjustments[key] !== undefined) {
          const val = config.adjustments[key];
          if (typeof val === 'number' && !isNaN(val)) {
            adjustments[key] = val;
          }
        }
      }
    }

    // High Latitude Strategy
    const highLatitudeStrategy = config.highLatitudeStrategy ?? 'MiddleOfNight';
    const validStrategies = ['AngleBased', 'MiddleOfNight', 'SeventhOfNight', 'NearestLatitude'];
    if (!validStrategies.includes(highLatitudeStrategy)) {
      return { success: false, error: `Invalid high latitude strategy: ${highLatitudeStrategy}` };
    }

    const regionalFallbackLatitude = config.regionalFallbackLatitude ?? 45;
    if (isNaN(regionalFallbackLatitude) || regionalFallbackLatitude < -90 || regionalFallbackLatitude > 90) {
      return { success: false, error: 'Regional fallback latitude must be between -90 and 90' };
    }

    return {
      success: true,
      config: {
        latitude: lat,
        longitude: long,
        date,
        timeZone,
        method: methodConfig,
        madhab,
        elevationMeters,
        temperatureC: temp,
        pressureMbar: pressure,
        adjustments,
        withMetadata: !!config.withMetadata,
        highLatitudeStrategy: highLatitudeStrategy as any,
        regionalFallbackLatitude,
        ...(config.resolveTimezoneAsync ? { resolveTimezoneAsync: config.resolveTimezoneAsync } : {})
      },
    };
  } catch (e: any) {
    return { success: false, error: `Validation exception: ${e.message || e}` };
  }
}
