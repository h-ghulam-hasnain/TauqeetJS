import type { QiblaCoordinates, QiblaDistanceResult } from '../types/index.js';
import { validateCoordinates } from '../../internal/validation.js';
import { haversineDistance } from '../../internal/math.js';
import { MECCA, EARTH_RADIUS_KM } from '../constants.js';

/**
 * Calculates the great-circle distance from a geographic location to the Kaaba.
 *
 * @param coordinates - The observer's latitude and longitude in decimal degrees.
 * @returns An object containing the shortest distance to the Kaaba in kilometres.
 * @throws {RangeError} If the provided coordinates are out of valid bounds.
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
