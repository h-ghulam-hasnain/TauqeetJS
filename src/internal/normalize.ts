/**
 * Wraps a longitude value into the range [-180, 180).
 */
export function normalizeLongitude(lon: number): number {
  let result = lon % 360;
  if (result > 180)  result -= 360;
  if (result <= -180) result += 360;
  return result;
}

/**
 * Clamps a latitude value to [-90, 90].
 */
export function normalizeLatitude(lat: number): number {
  return Math.min(90, Math.max(-90, lat));
}

/**
 * Wraps an angle (in degrees) into [0, 360).
 */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
