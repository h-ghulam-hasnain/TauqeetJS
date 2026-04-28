import { atan2d, cosd, sind, tand } from '../core/math.js';
import { Coordinates } from '../prayer/types/index.js';
import { Result, validateInputs, Success } from '../core/result.js';

const MAKKAH_LAT = 21.42248700;
const MAKKAH_LNG = 39.82620600;

export interface QiblaResult {
  bearing: number;
  rhumbLine: number;
  distance: number;
}

/**
 * Calculates the direction to the Kaaba (Qibla) from a given coordinate.
 */
export function calculateQibla(coords: Coordinates): Result<QiblaResult> {
  const validation = validateInputs(coords.latitude, coords.longitude);
  if (!validation.success) return validation as any;

  const phi = coords.latitude;
  const lambda = coords.longitude;

  const y = sind(MAKKAH_LNG - lambda);
  const x = cosd(phi) * tand(MAKKAH_LAT) - sind(phi) * cosd(MAKKAH_LNG - lambda);

  let qibla = atan2d(y, x);
  if (qibla < 0) qibla += 360;

  // Rhumb Line calculation (loxodromic)
  const dPhi = Math.log(tand(MAKKAH_LAT / 2 + 45) / tand(phi / 2 + 45));
  const dLon = (MAKKAH_LNG - lambda) * Math.PI / 180;
  let rhumb = atan2d(dLon, dPhi);
  if (rhumb < 0) rhumb += 360;

  // Haversine Distance
  const R = 6371;
  const dLat = (MAKKAH_LAT - phi) * Math.PI / 180;
  const dl = (MAKKAH_LNG - lambda) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(phi * Math.PI / 180) * Math.cos(MAKKAH_LAT * Math.PI / 180) * Math.sin(dl / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Success({
    bearing: qibla,
    rhumbLine: rhumb,
    distance: distance
  });
}

export { calculateSunAtQibla } from './sun-qibla.js';
