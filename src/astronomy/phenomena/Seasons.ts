import { computeSolarPosition } from '../bodies/sun/SolarEphemeris.js';
import { calculateDeltaT } from '../time/DeltaT.js';
import { dateToJulianDay, julianDayToDate } from '../time/JulianDate.js';
import type { EventTime } from '../types/phenomena.js';

export interface SeasonInfo {
  readonly marchEquinox: EventTime;
  readonly juneSolstice: EventTime;
  readonly septemberEquinox: EventTime;
  readonly decemberSolstice: EventTime;
}

function eventTimeFromJd(julianDay: number): EventTime {
  const { year, month, day } = julianDayToDate(julianDay);
  let dayWhole = Math.trunc(day);
  const dayFraction = day - dayWhole;
  const ut = dayFraction * 24;
  let hour = Math.trunc(ut);
  let minute = Math.trunc((ut - hour) * 60);
  let second = Math.round(((ut - hour) * 60 - minute) * 60);

  if (second >= 60) {
    second = 0;
    minute += 1;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
      if (hour >= 24) {
        hour = 0;
        dayWhole += 1;
      }
    }
  }

  return { julianDay, ut, year, month, day: dayWhole, hour, minute, second };
}

function getLongitudeDiff(jd: number, targetLon: number, deltaT: number): number {
  const pos = computeSolarPosition(jd, 0, deltaT);
  let diff = pos.apparentLongitude - targetLon;
  diff = ((diff + 180) % 360 + 360) % 360 - 180;
  return diff;
}

export function searchSeasonEvent(year: number, targetLon: number, estimateMonth: number, estimateDay: number): EventTime {
  const deltaT = calculateDeltaT(year);
  let jd = dateToJulianDay(year, estimateMonth, estimateDay);

  // We use Newton-Raphson with numerical derivative
  for (let iter = 0; iter < 10; iter++) {
    const diff = getLongitudeDiff(jd, targetLon, deltaT);
    if (Math.abs(diff) < 1e-8) {
      break;
    }
    const h = 0.005; // 7.2 minutes
    const diff2 = getLongitudeDiff(jd + h, targetLon, deltaT);
    const deriv = (diff2 - diff) / h;
    const step = diff / (deriv || 0.9856);
    jd -= step;
  }

  return eventTimeFromJd(jd);
}

export function computeSeasons(year: number): SeasonInfo {
  return {
    marchEquinox: searchSeasonEvent(year, 0, 3, 20),
    juneSolstice: searchSeasonEvent(year, 90, 6, 21),
    septemberEquinox: searchSeasonEvent(year, 180, 9, 22),
    decemberSolstice: searchSeasonEvent(year, 270, 12, 21)
  };
}
