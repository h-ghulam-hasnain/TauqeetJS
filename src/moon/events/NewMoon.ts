import {
  computeNextNewMoon,
  computePreviousNewMoon,
  dateToJulianDay,
  calculateDeltaT,
} from '../../astronomy/index.js';

function eventTimeToDate(event: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}): Date {
  return new Date(
    Date.UTC(event.year, event.month - 1, event.day, event.hour, event.minute, event.second)
  );
}

/**
 * Finds the exact Date of the immediate next New Moon (astronomical conjunction).
 *
 * @param afterDate - The starting date from which to search forward.
 * @returns A `Date` object representing the exact UTC moment of the next New Moon.
 */
export function getNextNewMoon(afterDate: Date): Date {
  const year = afterDate.getUTCFullYear();
  const month = afterDate.getUTCMonth() + 1;
  const day = afterDate.getUTCDate();
  const ut =
    afterDate.getUTCHours() + afterDate.getUTCMinutes() / 60 + afterDate.getUTCSeconds() / 3600;

  const jd = dateToJulianDay(year, month, day) + ut / 24;
  const deltaT = calculateDeltaT(year);

  const event = computeNextNewMoon(jd, deltaT);
  return eventTimeToDate(event);
}

/**
 * Finds the exact Date of the immediate previous New Moon (astronomical conjunction).
 *
 * @remarks
 * This function is heavily used as a baseline for Hijri calendar calculations and Moon age determination.
 *
 * @param beforeDate - The starting date from which to search backward.
 * @returns A `Date` object representing the exact UTC moment of the previous New Moon.
 */
export function getPreviousNewMoon(beforeDate: Date): Date {
  const year = beforeDate.getUTCFullYear();
  const month = beforeDate.getUTCMonth() + 1;
  const day = beforeDate.getUTCDate();
  const ut =
    beforeDate.getUTCHours() + beforeDate.getUTCMinutes() / 60 + beforeDate.getUTCSeconds() / 3600;

  const jd = dateToJulianDay(year, month, day) + ut / 24;
  const deltaT = calculateDeltaT(year);

  const event = computePreviousNewMoon(jd, deltaT);
  return eventTimeToDate(event);
}
