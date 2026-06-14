/**
 * Validates latitude and longitude values, throwing RangeError with a
 * descriptive message if a value is out of its legal range.
 */
export function validateCoordinates(latitude: number, longitude: number): void {
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    throw new RangeError(`Latitude must be a number, received: ${latitude}`);
  }
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    throw new RangeError(`Longitude must be a number, received: ${longitude}`);
  }
  if (latitude < -90 || latitude > 90) {
    throw new RangeError(`Latitude must be between -90 and 90, received: ${latitude}`);
  }
  if (longitude < -180 || longitude > 180) {
    throw new RangeError(`Longitude must be between -180 and 180, received: ${longitude}`);
  }
}
