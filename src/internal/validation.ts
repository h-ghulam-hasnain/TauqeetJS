/**
 * Validates latitude and longitude values, throwing RangeError with a
 * descriptive message if a value is out of its legal range.
 */
import { InvalidArgumentError } from '../astronomy/errors.js';

export function validateCoordinates(latitude: number, longitude: number): void {
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    throw new InvalidArgumentError(`Latitude must be a number, received: ${latitude}`);
  }
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    throw new InvalidArgumentError(`Longitude must be a number, received: ${longitude}`);
  }
  if (latitude <= -90 || latitude >= 90) {
    throw new InvalidArgumentError(`Latitude must be strictly between -90 and 90, received: ${latitude}`);
  }
  if (longitude <= -180 || longitude >= 180) {
    throw new InvalidArgumentError(`Longitude must be strictly between -180 and 180, received: ${longitude}`);
  }
}
