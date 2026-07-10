export type Result<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: string };

export function Success<T>(data: T): Result<T> {
  return { success: true, data };
}

export function Failure(error: string): Result<never> {
  return { success: false, error };
}

// import { GeographicPosition } from '../../astronomy/index.js';

export type PrayerStatus =
  | 'SUCCESS'
  | 'CONTINUOUS_TWILIGHT'
  | 'ASTRONOMICAL_MIDNIGHT'
  | 'POLAR_NIGHT'
  | 'POLAR_DAY'
  | 'REGIONAL_FALLBACK';

export interface DMSTuple {
  readonly degrees: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly direction: 'N' | 'S' | 'E' | 'W' | 'n' | 's' | 'e' | 'w';
}

export type CoordinateInput = number | string | DMSTuple;

export interface ElevationInput {
  readonly value: number;
  readonly unit: 'meters' | 'feet';
}

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

export interface PrayerConfig {
  readonly lat: CoordinateInput;
  readonly long: CoordinateInput;
  readonly timeZone?: string | number;
  readonly date?: Date | number | string;
  readonly method?: string | PrayerMethodConfig;
  readonly madhab?: 'Hanafi' | 'Shafi' | 'Maliki' | 'Hanbali' | 'Jaafari' | 'Jafari';
  readonly elevation?: number | ElevationInput;
  readonly temperatureC?: number;
  readonly pressureMbar?: number;
  readonly resolveTimezoneAsync?: (lat: number, lon: number) => Promise<string> | string;
  readonly adjustments?: Partial<
    Record<'fajr' | 'sunrise' | 'dhahwaKubra' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', number>
  >;
  readonly withMetadata?: boolean;
  readonly highLatitudeStrategy?:
    | 'AngleBased'
    | 'MiddleOfNight'
    | 'SeventhOfNight'
    | 'NearestLatitude';
  readonly regionalFallbackLatitude?: number; // fallback latitude if Case 5 triggered (default 45)
}

export interface TimeField {
  readonly utc: string | null; // ISO 8601 String ("2026-05-24T04:12:00Z")
  readonly local: string | null; // Formatted display text ("05:12 AM") using target timezone
  readonly timestamp: number | null; // Raw UNIX epoch timestamp
  readonly status: PrayerStatus;
}

export type Time = string;
export type time = string;

export interface PrayerMetadata {
  readonly fajr?: {
    readonly DEC: number;
    readonly EOT_min: number;
    readonly angle: number;
    readonly iterations: number;
  };
  readonly sunrise?: {
    readonly DEC: number;
    readonly EOT_min: number;
    readonly HP_arcmin: number;
    readonly SD_arcmin: number;
    readonly elevationMeters: number;
    readonly refraction_deg: number;
    readonly iterations: number;
  };
  readonly dhuha?: {
    readonly fajrTime: string;
    readonly maghribTime: string;
  };
  readonly dhuhr?: {
    readonly EOT_min: number;
    readonly iterations: number;
  };
  readonly asr?: {
    readonly DEC_of_Dhuhr: number;
    readonly DEC_of_Asr: number;
    readonly EOT_min: number;
    readonly SD_of_Dhuhr_arcmin: number;
    readonly SD_of_Asr_arcmin: number;
    readonly refraction_of_Dhuhr_deg: number;
    readonly refraction_of_Asr_deg: number;
    readonly asrAngle: number;
    readonly iterations: number;
  };
  readonly maghrib?: {
    readonly DEC: number;
    readonly EOT_min: number;
    readonly HP_arcmin: number;
    readonly SD_arcmin: number;
    readonly refraction_deg: number;
    readonly iterations: number;
  };
  readonly isha?: {
    readonly DEC?: number;
    readonly EOT_min?: number;
    readonly angle?: number;
    readonly iterations?: number;
    // High latitude contextual fields:
    readonly highLatitudeSelectedDateMaghribTime?: string;
    readonly highLatitudeFajrNextDay?: string;
    readonly highLatitudeIshaSelectedDate?: string;
  };
}

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
