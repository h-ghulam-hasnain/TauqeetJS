import type { QiblaCoordinates, QiblaDistanceResult } from '../types/index.js';
import { validateCoordinates } from '../../internal/validation.js';
import { haversineDistance } from '../../internal/math.js';
import { MECCA, EARTH_RADIUS_KM } from '../constants.js';

/**
 * Calculates the great-circle distance from any geographic location to the Kaaba.
 *
 * @param coordinates Observer's latitude and longitude in decimal degrees.
 * @returns           Great-circle distance to the Kaaba in kilometres.
 * @throws            RangeError if coordinates are invalid.
 */
export function getQiblaDistance(coordinates: QiblaCoordinates): QiblaDistanceResult {
  validateCoordinates(coordinates.latitude, coordinates.longitude);

  const distanceKm = haversineDistance(
    coordinates.latitude,
    coordinates.longitude,
    MECCA.latitude,
    MECCA.longitude,
    EARTH_RADIUS_KM
  );

  return { distanceKm };
}
