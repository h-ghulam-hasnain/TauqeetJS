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

// WGS-84 Ellipsoid flattening parameter (IUGG 1984)
const WGS84_F = 1 / 298.257_223_563;      // Flattening

/**
 * Vincenty Inverse formula — initial forward azimuth (bearing) on the WGS-84
 * ellipsoid from point 1 to point 2.
 *
 * @remarks
 * Vincenty's iterative method converges to sub-millimetre accuracy for
 * virtually all coordinate pairs on Earth. The single known failure mode is the
 * exact antipodal case, where the algorithm oscillates and never converges.
 * This implementation detects non-convergence (> 100 iterations or λ > π)
 * and returns `null` so callers can apply a safe fallback without any exception
 * being thrown or the event-loop hanging.
 *
 * @param lat1 - Observer latitude in decimal degrees.
 * @param lon1 - Observer longitude in decimal degrees.
 * @param lat2 - Target latitude in decimal degrees.
 * @param lon2 - Target longitude in decimal degrees.
 * @returns Initial forward azimuth in degrees `[0, 360)`, or `null` if the
 *   algorithm fails to converge (antipodal or co-incident points).
 *
 * @see T. Vincenty, "Direct and Inverse Solutions of Geodesics on the Ellipsoid
 *   with Application of Nested Equations", Survey Review, 1975.
 */
export function calculateVincentyInverseBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number | null {
  // Reduced (parametric) latitudes on the auxiliary sphere
  const U1 = Math.atan((1 - WGS84_F) * Math.tan(toRadians(lat1)));
  const U2 = Math.atan((1 - WGS84_F) * Math.tan(toRadians(lat2)));

  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);

  // Difference of longitudes on the auxiliary sphere; starts at geodetic Δλ
  const L = toRadians(lon2 - lon1);
  let lambda = L;

  let sinLambda = 0.0;
  let cosLambda = 0.0;
  let sinSigma  = 0.0;
  let cosSigma  = 0.0;
  let sigma      = 0.0;
  let sinAlpha   = 0.0;
  let cosSqAlpha = 0.0;   // cosSquaredAlpha — superscript/Greek chars are invalid TS identifiers
  let cos2SigmaM = 0.0;

  const MAX_ITER = 100;
  const TOLERANCE = 1e-12;

  let iter = 0;
  let lambdaPrev = 0.0;

  do {
    lambdaPrev = lambda;
    sinLambda  = Math.sin(lambda);
    cosLambda  = Math.cos(lambda);

    const sinSigmaTerm1 = cosU2 * sinLambda;
    const sinSigmaTerm2 = cosU1 * sinU2 - sinU1 * cosU2 * cosLambda;

    sinSigma = Math.sqrt(sinSigmaTerm1 * sinSigmaTerm1 + sinSigmaTerm2 * sinSigmaTerm2);

    // Co-incident points — every direction is valid, bearing undefined.
    if (sinSigma === 0) return null;

    cosSigma   = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma      = Math.atan2(sinSigma, cosSigma);
    sinAlpha   = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;

    // Equatorial line: cosSqAlpha = 0 → cos2SigmaM defined as 0
    cos2SigmaM = cosSqAlpha === 0
      ? 0
      : cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha;

    const C = (WGS84_F / 16) * cosSqAlpha * (4 + WGS84_F * (4 - 3 * cosSqAlpha));

    lambda = L + (1 - C) * WGS84_F * sinAlpha * (
      sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM))
    );

    // Antipodal guard: lambda past ±π means no geodesic can be determined.
    if (Math.abs(lambda) > Math.PI) return null;

  } while (Math.abs(lambda - lambdaPrev) > TOLERANCE && ++iter < MAX_ITER);

  // Maximum iterations exceeded — antipodal / near-antipodal non-convergence.
  if (iter >= MAX_ITER) return null;

  // ── Final azimuth calculation ──────────────────────────────────────────────
  const sinLambdaFinal = Math.sin(lambda);
  const cosLambdaFinal = Math.cos(lambda);

  const fwdAzimuthRad = Math.atan2(
    cosU2 * sinLambdaFinal,
    cosU1 * sinU2 - sinU1 * cosU2 * cosLambdaFinal
  );

  return ((toDegrees(fwdAzimuthRad) % 360) + 360) % 360;
}
