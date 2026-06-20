import { computeSiderealTime, type SiderealTimeResult } from '../time/SiderealTime.js';

export function computeApparentSiderealTime(
  jd: number,
  t: number,
  deltaPsi: number,
  eps: number
): SiderealTimeResult {
  return computeSiderealTime(jd, t, deltaPsi, eps);
}
