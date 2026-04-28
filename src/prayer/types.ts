/**
 * Types and interfaces for Islamic Prayer calculations.
 */

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

export const PRESETS: Record<CalculationMethod, MethodParams> = {
  MWL: { fajrAngle: 18, ishaAngle: 17 },
  ISNA: { fajrAngle: 15, ishaAngle: 15 },
  Egypt: { fajrAngle: 19.5, ishaAngle: 17.5 },
  Makkah: { fajrAngle: 18.5, ishaInterval: 90 },
  Karachi: { fajrAngle: 18, ishaAngle: 18 },
  Tehran: { fajrAngle: 17.7, ishaAngle: 14, maghribAngle: 4.5 },
  Jafari: { fajrAngle: 16, ishaAngle: 14, maghribAngle: 4 },
};

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhahwaKubra: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
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
  fajr: Date;
  maghrib: Date;
  sahurEndsAt: Date;
  iftarAt: Date;
}
