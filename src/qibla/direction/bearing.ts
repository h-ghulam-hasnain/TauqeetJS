import type {
  QiblaCoordinates,
  QiblaDirectionResult,
  QiblaAdvancedResult,
} from '../types/index.js';
import { validateCoordinates } from '../../internal/validation.js';
import {
  haversineDistance,
  sphericalLawOfCosinesBearing,
  rhumbLineBearing,
  calculateVincentyInverseBearing,
} from '../../internal/math.js';
import { MECCA, EARTH_RADIUS_KM } from '../constants.js';

/**
 * Calculates the geodesic Qibla direction from a geographic location to the
 * Kaaba using a hybrid Vincenty + Spherical fallback strategy.
 *
 * @remarks
 * **Primary engine:** Vincenty Inverse (WGS-84 ellipsoid, sub-millimetre
 * accuracy, converges in ≤ 100 iterations for the vast majority of the globe).
 *
 * **Fallback engine:** Spherical Law of Cosines (great-circle bearing on a
 * mean-radius sphere). Automatically engaged when Vincenty returns `null`,
 * which happens only at the exact antipode of Makkah (~20 015 km away) or
 * for co-incident points — both edge cases where the Spherical result is
 * equally well-defined and stable.
 *
 * The consumer sees a single, unified `bearing` value and is never exposed to
 * which internal algorithm produced it.
 *
 * @param coordinates - The observer's latitude and longitude in decimal degrees.
 * @returns An object containing the true-north bearing (in degrees, or `null`
 *   if the observer is at the Kaaba) and the haversine distance in kilometres.
 * @throws {RangeError} If the provided coordinates are out of valid bounds.
 */
export function getQiblaDirection(coordinates: QiblaCoordinates): QiblaDirectionResult {
  validateCoordinates(coordinates.latitude, coordinates.longitude);

  const distanceKm = haversineDistance(
    coordinates.latitude,
    coordinates.longitude,
    MECCA.latitude,
    MECCA.longitude,
    EARTH_RADIUS_KM
  );

  // At the Kaaba itself — every direction is Qibla's origin.
  if (distanceKm < 0.001) {
    return { bearing: null, distanceKm };
  }

  // ── Hybrid bearing engine ─────────────────────────────────────────────────
  // 1. Attempt WGS-84 ellipsoidal precision via Vincenty Inverse.
  // 2. On null (antipodal non-convergence), fall back to stable Spherical.
  const bearing =
    calculateVincentyInverseBearing(
      coordinates.latitude,
      coordinates.longitude,
      MECCA.latitude,
      MECCA.longitude
    ) ??
    sphericalLawOfCosinesBearing(
      coordinates.latitude,
      coordinates.longitude,
      MECCA.latitude,
      MECCA.longitude
    );

  return { bearing, distanceKm };
}

/**
 * Calculates both the WGS-84 geodesic and rhumb-line Qibla directions.
 *
 * @remarks
 * The geodesic bearing uses the same Vincenty + Spherical hybrid as
 * `getQiblaDirection`. The rhumb bearing is computed independently via the
 * loxodromic formula with anti-meridian normalization.
 *
 * @param coordinates - The observer's latitude and longitude in decimal degrees.
 * @returns An advanced result object including both bearings and the distance.
 *   Bearings are `null` if the observer is at the Kaaba.
 * @throws {RangeError} If the provided coordinates are out of valid bounds.
 */
export function getQiblaAdvanced(coordinates: QiblaCoordinates): QiblaAdvancedResult {
  validateCoordinates(coordinates.latitude, coordinates.longitude);

  const distanceKm = haversineDistance(
    coordinates.latitude,
    coordinates.longitude,
    MECCA.latitude,
    MECCA.longitude,
    EARTH_RADIUS_KM
  );

  // At the Kaaba.
  if (distanceKm < 0.001) {
    return { bearing: null, rhumbBearing: null, distanceKm };
  }

  // ── Hybrid bearing (same strategy as getQiblaDirection) ───────────────────
  const bearing =
    calculateVincentyInverseBearing(
      coordinates.latitude,
      coordinates.longitude,
      MECCA.latitude,
      MECCA.longitude
    ) ??
    sphericalLawOfCosinesBearing(
      coordinates.latitude,
      coordinates.longitude,
      MECCA.latitude,
      MECCA.longitude
    );

  const rhumbBearing = rhumbLineBearing(
    coordinates.latitude,
    coordinates.longitude,
    MECCA.latitude,
    MECCA.longitude
  );

  return { bearing, rhumbBearing, distanceKm };
}
