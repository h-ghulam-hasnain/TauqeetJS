import { normalizeDegrees } from '../../internal/angles.js';
import type { JulianDateComponents, TimeArgument } from '../types/time.js';

export function dateToJulianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m === 1 || m === 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.trunc(y / 100);
  const b = 2 - a + Math.trunc(a / 4);
  return Math.trunc(365.25 * (y + 4716)) + Math.trunc(30.6001 * (m + 1)) + day + b - 1524.5;
}

export function julianDayToDate(jd: number): JulianDateComponents {
  const z = Math.trunc(jd + 0.5);
  const f = jd + 0.5 - z;
  const alpha = Math.trunc((z - 1867216.25) / 36524.25);
  const a = z + 1 + alpha - Math.trunc(alpha / 4);
  const b = a + 1524;
  const c = Math.trunc((b - 122.1) / 365.25);
  const d = Math.trunc(365.25 * c);
  const e = Math.trunc((b - d) / 30.6001);
  const day = b - d - Math.trunc(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { day, month, year };
}

export function timeArguments(j: number, ut: number, deltaT: number): TimeArgument {
  const jd = j + ut / 24;
  const jde = jd + deltaT / 86400;
  const t = (jd - 2451545) / 36525;
  const te = (jde - 2451545) / 36525;
  const tau = te / 10;
  return { jd, jde, t, te, tau };
}

export function normalizeTime(j: number, ut: number): readonly [number, number] {
  let resultJ = j;
  let resultUt = ut;
  while (resultUt < 0) {
    resultJ -= 1;
    resultUt += 24;
  }
  while (resultUt > 24) {
    resultJ += 1;
    resultUt -= 24;
  }
  return [resultJ, resultUt];
}

export function normalizeMeridianAngle(angle: number): number {
  if (angle > 180) {
    return angle - 360;
  }
  if (angle <= -180) {
    return angle + 360;
  }
  return angle;
}

export function asTimeParts(value: number): { hour: number; minute: number; second: number } {
  const hour = Math.trunc(value);
  const minute = Math.trunc(60 * (value - hour));
  const second = Math.round(3600 * (value - hour - minute / 60));
  return { hour, minute, second };
}
