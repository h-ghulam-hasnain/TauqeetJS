import { computeSolarPosition, dateToJulianDay, calculateDeltaT } from '../../astronomy/index.js';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

function sind(deg: number) {
  return Math.sin(deg * D2R);
}
function cosd(deg: number) {
  return Math.cos(deg * D2R);
}
function asind(val: number) {
  return Math.asin(val) * R2D;
}

function getSunAltitude(j: number, ut: number, deltaT: number, lat: number, lon: number): number {
  const pos = computeSolarPosition(j, ut, deltaT);
  const lha = pos.gha + lon; // degrees
  const dec = pos.declination; // degrees

  const sinAlt = sind(lat) * sind(dec) + cosd(lat) * cosd(dec) * cosd(lha);
  return asind(sinAlt);
}

/**
 * Calculates the time of sunset for a given date and location.
 * Uses standard altitude of -0.833 degrees (accounting for refraction and semidiameter).
 * Returns null if the sun never sets (polar day) or never rises (polar night).
 */
export function getSunset(date: Date, latitude: number, longitude: number): Date | null {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const j = dateToJulianDay(year, month, day);
  const deltaT = calculateDeltaT(year);

  // Midday UT approximately
  let startUt = 12 - longitude / 15;
  // Ensure startUt is normalized if we want to search within a day,
  // but let's just search from midday to 12 hours later
  let endUt = startUt + 12;

  const targetAlt = -0.833;

  const altStart = getSunAltitude(j, startUt, deltaT, latitude, longitude);
  const altEnd = getSunAltitude(j, endUt, deltaT, latitude, longitude);

  // If the altitude crosses the target, we can binary search
  if (altStart < targetAlt || altEnd > targetAlt) {
    // Might be polar day/night, or the approximation of midday is slightly off.
    // Try to find the maximum altitude first, but for simplicity we assume startUt is close to midday.
    return null;
  }

  let midUt = 0;
  for (let i = 0; i < 25; i++) {
    midUt = (startUt + endUt) / 2;
    const midAlt = getSunAltitude(j, midUt, deltaT, latitude, longitude);
    if (midAlt > targetAlt) {
      startUt = midUt;
    } else {
      endUt = midUt;
    }
  }

  const sunsetTimeMs = Math.round(midUt * 3600000);
  return new Date(Date.UTC(year, month - 1, day) + sunsetTimeMs);
}
