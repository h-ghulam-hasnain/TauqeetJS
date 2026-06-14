import type { QiblaCoordinates, QiblaDirectionResult, QiblaAdvancedResult } from '../types/index.js';
import { validateCoordinates } from '../../internal/validation.js';
import { haversineDistance, sphericalLawOfCosinesBearing, rhumbLineBearing } from '../../internal/math.js';
import { MECCA, EARTH_RADIUS_KM } from '../constants.js';

/**
 * Calculates the Qibla direction from any geographic location to the Kaaba.
 *
 * @param coordinates Observer's latitude and longitude in decimal degrees.
 * @returns           Great-circle bearing and distance to the Kaaba. Returns null bearing if exactly at the Kaaba.
 * @throws            RangeError if coordinates are invalid.
 */
export function getQiblaDirection(coordinates: QiblaCoordinates): QiblaDirectionResult {
  validateCoordinates(coordinates.latitude, coordinates.longitude);

  const distanceKm = haversineDistance(coordinates.latitude, coordinates.longitude, MECCA.latitude, MECCA.longitude, EARTH_RADIUS_KM);
  
  if (distanceKm < 0.001) { // within 1 meter of Kaaba
    return { bearing: null, distanceKm };
  }

  const bearing = sphericalLawOfCosinesBearing(coordinates.latitude, coordinates.longitude, MECCA.latitude, MECCA.longitude);

  return { bearing, distanceKm };
}

/**
 * Calculates the advanced Qibla direction including Rhumb-line (loxodromic) bearing.
 *
 * @param coordinates Observer's latitude and longitude in decimal degrees.
 * @returns           Great-circle bearing, Rhumb-line bearing, and distance to the Kaaba. Returns null bearings if exactly at the Kaaba.
 * @throws            RangeError if coordinates are invalid.
 */
export function getQiblaAdvanced(coordinates: QiblaCoordinates): QiblaAdvancedResult {
  validateCoordinates(coordinates.latitude, coordinates.longitude);

  const distanceKm = haversineDistance(coordinates.latitude, coordinates.longitude, MECCA.latitude, MECCA.longitude, EARTH_RADIUS_KM);
  
  if (distanceKm < 0.001) {
    return { bearing: null, rhumbBearing: null, distanceKm };
  }

  const bearing      = sphericalLawOfCosinesBearing(coordinates.latitude, coordinates.longitude, MECCA.latitude, MECCA.longitude);
  const rhumbBearing = rhumbLineBearing(coordinates.latitude, coordinates.longitude, MECCA.latitude, MECCA.longitude);

  return { bearing, rhumbBearing, distanceKm };
}
