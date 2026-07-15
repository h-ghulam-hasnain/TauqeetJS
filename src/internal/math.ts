const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

/** Converts degrees to radians. */
export function toRadians(deg: number): number {
  return deg * DEG2RAD;
}

/** Converts radians to degrees. */
export function toDegrees(rad: number): number {
  return rad * RAD2DEG;
}

/**
 * Great-circle distance between two geographic points using the Haversine formula.
 * @returns Distance in kilometres.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm = 6371
): number {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Initial bearing from point 1 to point 2 using the Spherical Law of Cosines.
 * @returns Bearing in degrees, 0..360 (clockwise from true north).
 */
export function sphericalLawOfCosinesBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return ((toDegrees(Math.atan2(y, x)) % 360) + 360) % 360;
}

/**
 * Rhumb-line (loxodromic) bearing from point 1 to point 2.
 *
 * @remarks
 * Δλ is normalized to [−π, +π] to correctly handle anti-meridian crossings
 * (e.g., from Hawaii or the Western Pacific towards Makkah). Without this
 * normalization the bearing wraps the "long way" around the globe.
 *
 * @returns Bearing in degrees, 0..360.
 */
export function rhumbLineBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);

  const Δφ = Math.log(Math.tan(Math.PI / 4 + φ2 / 2) / Math.tan(Math.PI / 4 + φ1 / 2));

  // Normalize Δλ to [−π, +π] so anti-meridian crossings take the shorter arc.
  let Δλ = toRadians(lon2 - lon1);
  if (Math.abs(Δλ) > Math.PI) {
    Δλ = Δλ > 0 ? -(2 * Math.PI - Δλ) : (2 * Math.PI + Δλ);
  }

  return ((toDegrees(Math.atan2(Δλ, Δφ)) % 360) + 360) % 360;
}
