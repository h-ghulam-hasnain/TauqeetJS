import { SUN_ABERRATION_SECONDS } from '../constants/bodies.js';

export function computeSolarAberration(distanceAu: number): number {
  return -SUN_ABERRATION_SECONDS / distanceAu / 3600;
}
