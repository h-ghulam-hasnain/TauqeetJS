import { computePreviousNewMoon, dateToJulianDay, calculateDeltaT } from '../../astronomy/index.js';
import type { MoonAgeResult } from '../types/MoonAge.js';

/**
 * Calculates the age of the moon in days since the last New Moon.
 *
 * @param date The date for which to compute the moon age.
 * @returns An object containing age in days and the date of the previous New Moon.
 */
export function getMoonAge(date: Date): MoonAgeResult {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const ut =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;

  const jd = dateToJulianDay(year, month, day) + ut / 24;
  const deltaT = calculateDeltaT(year);

  const prevNewMoonEvent = computePreviousNewMoon(jd, deltaT);
  const prevNewMoonDate = new Date(
    Date.UTC(
      prevNewMoonEvent.year,
      prevNewMoonEvent.month - 1,
      prevNewMoonEvent.day,
      prevNewMoonEvent.hour,
      prevNewMoonEvent.minute,
      prevNewMoonEvent.second
    )
  );

  const ageDays = (date.getTime() - prevNewMoonDate.getTime()) / (24 * 3600 * 1000);

  return {
    ageDays,
    previousNewMoon: prevNewMoonDate,
  };
}
