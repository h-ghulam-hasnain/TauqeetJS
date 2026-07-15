import type {
  PrayerConfig,
  CoordinateInput,
  ElevationInput,
  PrayerMethodConfig,
} from '../types/index.js';
import { BUILT_IN_METHODS } from '../config/methodRegistry.js';
import { Madhab } from '../config/madhabs.js';
import { ConfigurationError } from '../errors.js';

/**
 * The normalized, internally-validated configuration object used by the prayer engine.
 *
 * @remarks
 * Contains concrete, safe values for coordinates, dates, and parsed methods.
 * Optional inputs from the user are resolved to their defaults here.
 */
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
  readonly adjustments: Readonly<Record<
    'fajr' | 'sunrise' | 'dhahwaKubra' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    number
  >>;
  readonly withMetadata: boolean;
  readonly highLatitudeStrategy:
    | 'AngleBased'
    | 'MiddleOfNight'
    | 'SeventhOfNight'
    | 'NearestLatitude';
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

  if (
    typeof input === 'object' &&
    'degrees' in input &&
    'minutes' in input &&
    'seconds' in input &&
    'direction' in input
  ) {
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
    if (isNaN(dateInput.getTime())) throw new ConfigurationError('Invalid Date object');
    return new Date(dateInput.getTime());
  }
  if (typeof dateInput === 'number') {
    // If it's a UNIX timestamp in seconds (e.g. less than 10000000000), convert to ms
    const ms = dateInput < 10000000000 ? dateInput * 1000 : dateInput;
    const d = new Date(ms);
    if (isNaN(d.getTime())) throw new ConfigurationError('Invalid timestamp');
    return d;
  }
  if (typeof dateInput === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      throw new ConfigurationError('String dates must be in ISO 8601 format (YYYY-MM-DD...)');
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) throw new ConfigurationError('Invalid date string');
    return d;
  }
  throw new ConfigurationError('Unsupported date format');
}

function parseElevation(elev?: number | ElevationInput): number {
  if (elev === undefined || elev === null) return 0;
  if (typeof elev === 'number') {
    if (isNaN(elev) || !isFinite(elev)) throw new ConfigurationError('Elevation must be a finite number');
    return elev;
  }
  if (typeof elev === 'object' && 'value' in elev && 'unit' in elev) {
    if (typeof elev.value !== 'number' || isNaN(elev.value) || !isFinite(elev.value)) {
      throw new ConfigurationError('Elevation value must be a finite number');
    }
    if (elev.unit === 'feet') {
      return elev.value * 0.3048;
    }
    if (elev.unit === 'meters') {
      return elev.value;
    }
  }
  throw new ConfigurationError('Unsupported elevation format');
}

/**
 * Represents the outcome of the configuration validation process.
 */
export type ValidationResult =
  | { success: true; config: ValidatedPrayerConfig }
  | { success: false; error: string };

const DEFAULT_PRAYER_CONFIG = {
  method: 'MWL',
  madhab: 'Standard',
  highLatitudeStrategy: 'MiddleOfNight'
} as const;

/**
 * Validates and normalizes user-provided prayer configuration.
 *
 * @remarks
 * Ensures coordinates are within bounds, resolves timezone and method defaults,
 * normalizes elevation, and prepares the configuration for the calculation engine.
 *
 * @param rawConfig - The raw, partial configuration provided by the user.
 * @returns A structured `ValidationResult` indicating success or detailing the error.
 */
export function validatePrayerConfig(rawConfig: PrayerConfig): ValidationResult {
  try {
    if (!rawConfig) {
      return { success: false, error: 'Configuration is required' };
    }

    // Safe merge filling in default values
    const config = { ...DEFAULT_PRAYER_CONFIG, ...rawConfig } as any;

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
    if (
      typeof pressure !== 'number' ||
      isNaN(pressure) ||
      !Number.isInteger(pressure) ||
      pressure < 500 ||
      pressure > 1100
    ) {
      return {
        success: false,
        error: 'Pressure must be an integer between 500 mbar and 1100 mbar',
      };
    }

    // Date normalization
    let date: Date;
    try {
      date = parseDate(config.date);
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) || 'Invalid date' };
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

    // Madhab (Default: Hanafi)
    let madhab: Madhab = Madhab.HANAFI;
    if (config.madhab !== undefined && config.madhab !== null) {
      const mStr = String(config.madhab).toLowerCase();
      if (mStr === 'hanafi') {
        madhab = Madhab.HANAFI;
      } else if (mStr === 'shafi' || mStr === 'shafii') {
        madhab = Madhab.SHAFI;
      } else if (mStr === 'maliki') {
        madhab = Madhab.MALIKI;
      } else if (mStr === 'hanbali') {
        madhab = Madhab.HANBALI;
      } else if (mStr === 'jaafari' || mStr === 'jafari') {
        madhab = Madhab.JAAFARI;
      } else if (mStr === 'standard') {
        madhab = Madhab.SHAFI; // Standard Asr shadow multiplier is 1 (Shafi, Maliki, Hanbali)
      } else {
        return { success: false, error: `Invalid madhab: ${config.madhab}` };
      }
    }

    // Method parsing
    const allowedMethods = BUILT_IN_METHODS[madhab];
    let methodConfig: PrayerMethodConfig;
    if (config.method === undefined || config.method === null) {
      const defaultMethod = Object.values(allowedMethods).find(m => m.isDefault);
      if (!defaultMethod) {
        return { success: false, error: `No default method found for madhab: ${madhab}` };
      }
      methodConfig = defaultMethod;
    } else if (typeof config.method === 'string') {
      const match =
        allowedMethods[config.method] ||
        Object.values(allowedMethods).find(m => m.id === config.method);
      if (!match) {
        return {
          success: false,
          error: `Unknown method preset: ${config.method} for madhab: ${madhab}`,
        };
      }
      methodConfig = match;
    } else if (typeof config.method === 'object') {
      const mc = config.method;
      if (
        typeof mc.id !== 'string' ||
        typeof mc.name !== 'string' ||
        typeof mc.fajrAngle !== 'number' ||
        isNaN(mc.fajrAngle)
      ) {
        return { success: false, error: 'Custom method config is missing required fields' };
      }
      if (mc.fajrAngle < 0 || mc.fajrAngle > 30) {
        return { success: false, error: 'fajrAngle must be between 0° and 30°' };
      }
      if (mc.ishaAngle !== undefined && mc.ishaAngle !== null) {
        if (typeof mc.ishaAngle !== 'number' || isNaN(mc.ishaAngle)) {
          return { success: false, error: 'ishaAngle must be a valid number when provided' };
        }
        if (mc.ishaAngle < 0 || mc.ishaAngle > 30) {
          return { success: false, error: 'ishaAngle must be between 0° and 30°' };
        }
      }
      methodConfig = {
        id: mc.id,
        name: mc.name,
        fajrAngle: mc.fajrAngle,
        ishaAngle: mc.ishaAngle !== undefined ? mc.ishaAngle : null,
        ishaMinutes: mc.ishaMinutes,
        maghribAngle: mc.maghribAngle,
        maghribMinutes: mc.maghribMinutes,
        asrShadowMultiplier:
          mc.asrShadowMultiplier !== undefined
            ? mc.asrShadowMultiplier
            : madhab === Madhab.HANAFI
              ? 2
              : 1,
        twilightType:
          mc.twilightType !== undefined
            ? mc.twilightType
            : madhab === Madhab.HANAFI
              ? 'White'
              : 'Red',
        description: mc.description || 'Custom Method Configuration',
        source: mc.source || 'Custom',
        isDefault: mc.isDefault,
      };
    } else {
      return { success: false, error: 'Invalid method configuration format' };
    }

    // Elevation
    let elevationMeters: number;
    try {
      elevationMeters = parseElevation(config.elevation);
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) || 'Invalid elevation' };
    }

    // Adjustments
    const adjustments: Record<
      'fajr' | 'sunrise' | 'dhahwaKubra' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
      number
    > = {
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
    if (
      isNaN(regionalFallbackLatitude) ||
      regionalFallbackLatitude < -90 ||
      regionalFallbackLatitude > 90
    ) {
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
        highLatitudeStrategy: highLatitudeStrategy as 'AngleBased' | 'MiddleOfNight' | 'SeventhOfNight' | 'NearestLatitude',
        regionalFallbackLatitude,
        ...(config.resolveTimezoneAsync
          ? { resolveTimezoneAsync: config.resolveTimezoneAsync }
          : {}),
      },
    };
  } catch (e: unknown) {
    return { success: false, error: `Validation exception: ${e instanceof Error ? e.message : String(e)}` };
  }
}
