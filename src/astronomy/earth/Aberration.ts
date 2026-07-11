import { SUN_ABERRATION_SECONDS } from '../constants/bodies.js';

/**
 * Computes the effect of solar aberration on the apparent position of the Sun.
 *
 * @remarks
 * Solar aberration is the displacement of the Sun's apparent position due to
 * the finite speed of light and the Earth's orbital motion.
 *
 * @param distanceAu - The true distance from the Earth to the Sun in Astronomical Units (AU).
 * @returns The aberration correction in degrees.
 */
export function computeSolarAberration(distanceAu: number): number {
  return -SUN_ABERRATION_SECONDS / distanceAu / 3600;
}
