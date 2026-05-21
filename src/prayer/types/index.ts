/**
 * Types and interfaces for Islamic Prayer calculations.
 */

export enum HighLatitudeMethod {
  MIDDLE_OF_THE_NIGHT = 'MIDDLE_OF_THE_NIGHT'
}

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
  | 'Jafari';     // Shia Ithna-Ashari, Leva Institute, Qum (Fajr 16, Isha 14)

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

export interface PrayerTimesResult {
  fajr: Date | null;
  sunrise: Date;
  dhahwaKubra: Date | null;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date | null;
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
  fajr: Date | null;
  maghrib: Date;
  sahurEndsAt: Date | null;
  iftarAt: Date;
}
