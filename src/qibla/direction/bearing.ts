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
} from '../../internal/math.js';
import { MECCA, EARTH_RADIUS_KM } from '../constants.js';

/**
 * Calculates the great-circle (shortest path) Qibla direction from a geographic location to the Kaaba.
 *
 * @param coordinates - The observer's latitude and longitude in decimal degrees.
 * @returns An object containing the true north bearing (in degrees) and the distance to the Kaaba. Returns a null bearing if the observer is located exactly at the Kaaba.
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

  if (distanceKm < 0.001) {
    // within 1 meter of Kaaba
    return { bearing: null, distanceKm };
  }

  const bearing = sphericalLawOfCosinesBearing(
    coordinates.latitude,
    coordinates.longitude,
    MECCA.latitude,
    MECCA.longitude
  );

  return { bearing, distanceKm };
}

/**
 * Calculates both the great-circle and rhumb-line (constant compass heading) Qibla directions.
 *
 * @remarks
 * While the great-circle path represents the absolute shortest distance, the rhumb-line path is
 * useful for simple navigation systems relying on a fixed compass heading.
 *
 * @param coordinates - The observer's latitude and longitude in decimal degrees.
 * @returns An advanced result object including both bearings and the distance. Bearings are null if at the Kaaba.
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

  if (distanceKm < 0.001) {
    return { bearing: null, rhumbBearing: null, distanceKm };
  }

  const bearing = sphericalLawOfCosinesBearing(
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
