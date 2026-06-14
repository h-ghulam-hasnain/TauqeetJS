/**
 * Represents a date in the Islamic Hijri calendar.
 */
export interface HijriDate {
  /** Year AH (Anno Hegirae) */
  year: number;
  /** Month (1 = Muharram .. 12 = Dhul Hijja) */
  month: number;
  /** Day of month (1–29 or 1–30 depending on month/year) */
  day: number;
}

/** Names of the 12 Hijri months in order. */
export const HIJRI_MONTH_NAMES = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Ula',
  'Jumada al-Akhira',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhul Qadah',
  'Dhul Hijja',
] as const;
