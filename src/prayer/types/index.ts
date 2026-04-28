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

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhahwaKubra: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  /**
   * Formats all prayer times into the specified format.
   * @param type The desired format.
   * @param timeZone Optional IANA time zone (e.g., 'America/New_York').
   */
  format?: (type: 'iso8601' | 'unix' | '12h' | '24h', timeZone?: string) => Record<Exclude<keyof PrayerTimesResult, 'format'>, string | number>;
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
