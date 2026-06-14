import { cosd } from '../../internal/trig.js';
import { normalizeDegrees } from '../../internal/angles.js';

export interface SiderealTimeResult {
  readonly gmst: number;
  readonly gast: number;
}

export function computeSiderealTime(jd: number, t: number, deltaPsi: number, eps: number): SiderealTimeResult {
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + t * t * (0.000387933 - t / 38710000);
  const gast = gmst + deltaPsi * cosd(eps);
  return {
    gmst: normalizeDegrees(gmst),
    gast: normalizeDegrees(gast),
  };
}
