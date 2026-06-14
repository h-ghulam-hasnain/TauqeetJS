import { computeNextFullMoon, computePreviousFullMoon, dateToJulianDay, calculateDeltaT } from '../../astronomy/index.js';

function eventTimeToDate(event: { year: number; month: number; day: number; hour: number; minute: number; second: number }): Date {
  return new Date(Date.UTC(event.year, event.month - 1, event.day, event.hour, event.minute, event.second));
}

/**
 * Computes the date of the next Full Moon.
 * 
 * @param afterDate The date after which to find the Full Moon.
 * @returns The Date object for the next Full Moon.
 */
export function getNextFullMoon(afterDate: Date): Date {
  const year = afterDate.getUTCFullYear();
  const month = afterDate.getUTCMonth() + 1;
  const day = afterDate.getUTCDate();
  const ut = afterDate.getUTCHours() + afterDate.getUTCMinutes() / 60 + afterDate.getUTCSeconds() / 3600;
  
  const jd = dateToJulianDay(year, month, day) + ut / 24;
  const deltaT = calculateDeltaT(year);

  const event = computeNextFullMoon(jd, deltaT);
  return eventTimeToDate(event);
}

/**
 * Computes the date of the previous Full Moon.
 * 
 * @param beforeDate The date before which to find the Full Moon.
 * @returns The Date object for the previous Full Moon.
 */
export function getPreviousFullMoon(beforeDate: Date): Date {
  const year = beforeDate.getUTCFullYear();
  const month = beforeDate.getUTCMonth() + 1;
  const day = beforeDate.getUTCDate();
  const ut = beforeDate.getUTCHours() + beforeDate.getUTCMinutes() / 60 + beforeDate.getUTCSeconds() / 3600;
  
  const jd = dateToJulianDay(year, month, day) + ut / 24;
  const deltaT = calculateDeltaT(year);

  const event = computePreviousFullMoon(jd, deltaT);
  return eventTimeToDate(event);
}
