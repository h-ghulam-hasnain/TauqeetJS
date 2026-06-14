/**
 * Types and interfaces for Islamic Prayer calculations.
 */

export enum HighLatitudeMethod {
  MIDDLE_OF_THE_NIGHT = 'MIDDLE_OF_THE_NIGHT',
  SEVENTH_OF_THE_NIGHT = 'SEVENTH_OF_THE_NIGHT',
  ANGLE_BASED = 'ANGLE_BASED'
}

export interface DMSLatitude {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: 'N' | 'S' | 'n' | 's';
}

export interface DMSLongitude {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: 'E' | 'W' | 'e' | 'w';
}

export type LatitudeInput = number | string | DMSLatitude;
export type LongitudeInput = number | string | DMSLongitude;

export interface DMSTuple {
  degrees: number;
  minutes: number;
  seconds: number;
  direction: 'N' | 'S' | 'E' | 'W';
}

export type CoordinateInput = number | string | DMSTuple;

export interface Coordinates {
  latitude: number;
  longitude: number;
  elevation?: number; // In meters
}

export type CalculationMethod =
  | 'MWL'         // Muslim World League (Fajr 18, Isha 17)
  | 'ISNA'        // ISNA (Fajr 15, Isha 15)
  | 'Egypt'       // Egyptian General Authority of Survey (Fajr 19.5, Isha 17.5)
  | 'Makkah'      // Umm al-Qura University, Makkah (Fajr 18.5, Isha 90min after Maghrib)
  | 'Karachi'     // University of Islamic Sciences, Karachi (Fajr 18, Isha 18)
  | 'Tehran'      // Institute of Geophysics, University of Tehran (Fajr 17.7, Isha 14)
  | 'Jafari'      // Shia Ithna-Ashari, Leva Institute, Qum (Fajr 16, Isha 14)
  | (string & {});

export interface MethodParams {
  fajrAngle: number;
  ishaAngle?: number;
  ishaInterval?: number; // In minutes after Maghrib
  maghribAngle?: number;
  maghribInterval?: number;
}

export interface PrayerMetadata {
  fajr?: { DEC: number; EOT: number; angle: number; iterations: number };
  sunrise?: { DEC: number; EOT: number; HP: number; SD: number; iterations: number };
  dhuhr?: { DEC: number; EOT: number; SD: number; iterations: number };
  asr?: { DEC: number; EOT: number; HP: number; SD: number; asrAngle: number; iterations: number };
  maghrib?: { DEC: number; EOT: number; HP: number; SD: number; iterations: number };
  isha?: { DEC: number; EOT: number; angle: number; iterations: number };
}

export interface TimeField {
  utc: string | null;       // ISO 8601 String ("2026-05-24T04:12:00Z")
  local: string | null;     // Formatted display text ("05:12 AM") using target timezone
  timestamp: number | null; // Raw UNIX epoch timestamp
  status: 'SUCCESS' | 'CONTINUOUS_TWILIGHT' | 'NO_TIME_FOR_ISHA' | 'POLAR_DAY' | 'POLAR_NIGHT';
}

export interface InternalPrayerTimes {
  fajr: { value: Date | null; status: TimeField['status'] };
  sunrise: { value: Date | null; status: TimeField['status'] };
  dhahwaKubra: { value: Date | null; status: TimeField['status'] };
  dhuhr: { value: Date | null; status: TimeField['status'] };
  asr: { value: Date | null; status: TimeField['status'] };
  maghrib: { value: Date | null; status: TimeField['status'] };
  isha: { value: Date | null; status: TimeField['status'] };
  metadata?: PrayerMetadata;
}

export interface PrayerTimesResult {
  fajr: TimeField;
  sunrise: TimeField;
  dhahwaKubra: TimeField;
  dhuhr: TimeField;
  asr: TimeField;
  maghrib: TimeField;
  isha: TimeField;
  metadata?: PrayerMetadata;
}

export interface MonthlyPrayerRow extends PrayerTimesResult {
  date: string;
  day: number;
  weekday: string;
}

export interface RamadanScheduleEntry {
  date: string;
  day: number;
  weekday: string;
  fajr: TimeField;
  maghrib: TimeField;
  sahurEndsAt: TimeField;
  iftarAt: TimeField;
}

export interface PrayerCalculationOptions {
  lat: LatitudeInput;
  long: LongitudeInput;
  format?: 'FLOAT' | 'DMS';
  timeZone?: string | number;
  date?: Date | string | number;
  method?: string;
  madhab?: 'Hanafi' | 'Shafi';
  elevation?: { value: number; unit: 'meters' | 'feet' };
  temperatureC?: number;
  pressureMbar?: number;
  resolveTimezoneAsync?: (lat: number, lon: number) => Promise<string> | string;
}
