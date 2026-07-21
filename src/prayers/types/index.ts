export interface FailureResultOptions {
  readonly code?: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;
}

/**
 * Represents a result wrapper for operations that can either succeed or fail without throwing exceptions.
 */
export type Result<T> =
  | { readonly success: true; readonly data: T }
  | {
      readonly success: false;
      readonly error: string;
      readonly code: string;
      readonly details?: Record<string, unknown>;
      readonly cause?: unknown;
    };

/**
 * Wraps successful data into a Result object.
 *
 * @param data - The successful calculation output.
 * @returns A Result object marked as successful.
 */
export function Success<T>(data: T): Result<T> {
  return { success: true, data };
}

/**
 * Wraps an error message into a Result object.
 *
 * @param error - A descriptive error message.
 * @returns A Result object marked as failed.
 */
export function Failure(error: string, options: FailureResultOptions = {}): Result<never> {
  return {
    success: false,
    error,
    code: options.code ?? 'PRAYER_ERROR',
    ...(options.details ? { details: options.details } : {}),
    ...(options.cause !== undefined ? { cause: options.cause } : {}),
  };
}

// import { GeographicPosition } from '../../astronomy/index.js';

/**
 * Indicates the calculation state or astronomical condition for a specific prayer time.
 *
 * @remarks
 * Values like 'CONTINUOUS_TWILIGHT' or 'POLAR_NIGHT' indicate that standard calculation
 * methods failed to converge, triggering high-latitude fallback rules.
 */
export type PrayerStatus =
  | 'SUCCESS'
  | 'CONTINUOUS_TWILIGHT'
  | 'ASTRONOMICAL_MIDNIGHT'
  | 'POLAR_NIGHT'
  | 'POLAR_DAY'
  | 'REGIONAL_FALLBACK';

/**
 * Represents geographic coordinates using Degrees, Minutes, and Seconds (DMS).
 */
export interface DMSTuple {
  readonly degrees: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly direction: 'N' | 'S' | 'E' | 'W' | 'n' | 's' | 'e' | 'w';
}

/**
 * Accepts decimal degrees as a number, a formatted string, or a structured DMS tuple.
 */
export type CoordinateInput = number | string | DMSTuple;

/**
 * Specifies an elevation above sea level with its corresponding unit.
 */
export interface ElevationInput {
  readonly value: number;
  readonly unit: 'meters' | 'feet';
}

/**
 * Configuration detailing how a specific calculation method determines prayer times.
 *
 * @remarks
 * Standard methods (e.g., MWL, ISNA) provide built-in angles, while custom methods can
 * specify explicit degrees or minute offsets for twilight calculations.
 */
export interface PrayerMethodConfig {
  readonly id: string;
  readonly name: string;
  readonly fajrAngle: number;
  readonly ishaAngle: number | null; // null if ishaMinutes/interval is used instead
  readonly ishaMinutes?: number | undefined; // Minutes after Maghrib (e.g. Umm al-Qura: 90)
  readonly maghribAngle?: number | undefined; // If non-null, Maghrib uses angle not sunset
  readonly maghribMinutes?: number | undefined; // Minutes after sunset (alternative)
  readonly source: string;
  readonly asrShadowMultiplier?: number | undefined;
  readonly twilightType?: 'White' | 'Red' | 'Custom' | undefined;
  readonly description?: string | undefined;
  readonly isDefault?: boolean | undefined;
}

export type BuiltInMethodId = 'ISNA' | 'MWL' | 'Egypt' | 'Makkah' | 'Karachi' | 'Tehran' | 'Kuwait' | 'Qatar' | 'Singapore' | 'France' | 'Russia' | 'Algeria' | 'CustomHanafi15Deg' | 'India' | 'Qom' | 'Malaysia' | 'Global' | 'UK';

/**
 * The core configuration object required to calculate prayer times.
 *
 * @remarks
 * Includes geographic location, time, convention methods, and optional adjustments.
 *
 * @example
 * ```typescript
 * const config: PrayerConfig = {
 *   lat: 51.5074,
 *   long: -0.1278,
 *   date: "2026-03-15",
 *   method: 'MWL',
 *   madhab: 'Shafi',
 *   highLatitudeStrategy: 'AngleBased'
 * };
 * ```
 */
export interface PrayerConfig {
  readonly lat: CoordinateInput;
  readonly long: CoordinateInput;
  readonly timeZone?: string | number;
  readonly date?: Date | number | string;
  readonly method?: BuiltInMethodId | PrayerMethodConfig;
  readonly madhab?: 'Hanafi' | 'Shafi' | 'Maliki' | 'Hanbali' | 'Jaafari' | 'Jafari';
  readonly elevation?: number | ElevationInput;
  readonly temperatureC?: number;
  readonly pressureMbar?: number;
  readonly resolveTimezoneAsync?: (lat: number, lon: number) => Promise<string> | string;
  readonly adjustments?: Readonly<Partial<
    Record<'fajr' | 'sunrise' | 'dhahwaKubra' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number>
  >>;
  readonly withMetadata?: boolean;
  readonly highLatitudeStrategy?:
    | 'AngleBased'
    | 'MiddleOfNight'
    | 'SeventhOfNight'
    | 'NearestLatitude';
  readonly regionalFallbackLatitude?: number; // fallback latitude if Case 5 triggered (default 45)
}

/**
 * Represents a resolved prayer time, including formatted strings and a status indicator.
 */
export interface TimeField {
  readonly utc: string | null; // ISO 8601 String ("2026-05-24T04:12:00Z")
  readonly local: string | null; // Formatted display text ("05:12 AM") using target timezone
  readonly timestamp: number | null; // Raw UNIX epoch timestamp
  readonly status: PrayerStatus;
}


/**
 * Detailed astronomical metadata generated during prayer calculations.
 *
 * @remarks
 * Exposes precise ephemeris data (declination, equation of time, refraction) primarily
 * used for debugging, logging, or advanced astronomical integrations. Only included if
 * `withMetadata` is true in the `PrayerConfig`.
 */
export interface PrayerMetadata {
  readonly fajr?: {
    readonly DEC: number;
    readonly EOT_min: number;
    readonly EOT?: number;
    readonly angle: number;
    readonly iterations: number;
  };
  readonly sunrise?: {
    readonly DEC: number;
    readonly EOT_min: number;
    readonly EOT?: number;
    readonly HP_arcmin: number;
    readonly HP?: number;
    readonly SD_arcmin: number;
    readonly SD?: number;
    readonly elevationMeters: number;
    readonly refraction_deg: number;
    readonly refraction?: number;
    readonly iterations: number;
  };
  readonly dhahwaKubra?: {
    readonly fajrTime: string;
    readonly maghribTime: string;
  };
  readonly dhuhr?: {
    readonly EOT_min: number;
    readonly EOT?: number;
    readonly iterations: number;
  };
  readonly asr?: {
    readonly DEC_of_Dhuhr: number;
    readonly DEC_of_Asr: number;
    readonly EOT_min: number;
    readonly EOT?: number;
    readonly SD_of_Dhuhr_arcmin: number;
    readonly SD_of_Asr_arcmin: number;
    readonly SD_of_Dhuhr?: number;
    readonly SD_of_Asr?: number;
    readonly refraction_of_Dhuhr_deg: number;
    readonly refraction_of_Asr_deg: number;
    readonly refraction_of_Dhuhr?: number;
    readonly refraction_of_Asr?: number;
    readonly asrAngle: number;
    readonly iterations: number;
  };
  readonly maghrib?: {
    readonly DEC: number;
    readonly EOT_min: number;
    readonly EOT?: number;
    readonly HP_arcmin: number;
    readonly HP?: number;
    readonly SD_arcmin: number;
    readonly SD?: number;
    readonly refraction_deg: number;
    readonly refraction?: number;
    readonly iterations: number;
  };
  readonly isha?: {
    readonly DEC?: number;
    readonly EOT_min?: number;
    readonly EOT?: number;
    readonly angle?: number;
    readonly iterations?: number;
    // High latitude contextual fields:
    readonly highLatitudeSelectedDateMaghribTime?: string;
    readonly highLatitudeFajrNextDay?: string;
    readonly highLatitudeIshaSelectedDate?: string;
  };
}

/**
 * The final output object containing all daily prayer times and optional metadata.
 */
export interface PrayerTimesResult {
  readonly fajr: TimeField;
  readonly sunrise: TimeField;
  readonly dhahwaKubra: TimeField;
  readonly dhuhr: TimeField;
  readonly asr: TimeField;
  readonly maghrib: TimeField;
  readonly isha: TimeField;
  readonly metadata?: PrayerMetadata;
}

export type DayType = 'NORMAL' | 'HIGH_LATITUDE' | 'POLAR_DAY' | 'POLAR_NIGHT';
export type CalculationStrategy = 'NONE' | 'ANGLE_BASED' | 'MIDDLE_OF_NIGHT' | 'SEVENTH_OF_NIGHT' | 'NEAREST_LATITUDE_FALLBACK';

export interface UnifiedPrayerTimesResult {
  readonly date: string; // "YYYY-MM-DD"
  readonly times: {
    readonly fajr: string;
    readonly sunrise: string;
    readonly dhuhr: string;
    readonly asr: string;
    readonly maghrib: string;
    readonly isha: string;
  };
  readonly metadata: {
    readonly dayType: DayType;
    readonly appliedStrategy: CalculationStrategy;
    readonly evaluatedLatitude: number;
  };
}

export const isPolarZone = (dayType: DayType): boolean => 
  dayType === 'POLAR_DAY' || dayType === 'POLAR_NIGHT';

export const hasHighLatitudeAdjustment = (dayType: DayType): boolean => 
  dayType === 'HIGH_LATITUDE';
