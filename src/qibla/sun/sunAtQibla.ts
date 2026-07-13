import type { SunAlignmentConfig, SunAtQiblaResult, SolarTimeField } from '../types/index.js';
import { validateCoordinates } from '../../internal/validation.js';
import { normalizeAngle } from '../../internal/normalize.js';
import { toDegrees, toRadians } from '../../internal/math.js';
import { getQiblaDirection } from '../index.js';
import { computeSolarPosition, dateToJulianDay, calculateDeltaT } from '../../astronomy/index.js';
import type { SolarPositionResult } from '../../astronomy/types/ephemeris.js';

/**
 * Solves the PZX spherical triangle for the Polar Angle P (Hour Angle).
 * P = North Pole, Z = Zenith, S = Sun.
 *
 * @param PZdeg Colatitude (90 - latitude) in degrees.
 * @param PSdeg Polar distance of the sun (90 - declination) in degrees.
 * @param Zdeg  Azimuth of the sun (target direction) in degrees.
 * @returns     The Hour Angle P in degrees, or NaN if unsolvable.
 */
function calculatePolarAngleP(PZdeg: number, PSdeg: number, Zdeg: number): number {
  const c = PZdeg;
  const b = PSdeg;
  const B = Zdeg;

  const sinC = Math.sin(toRadians(c));
  const cosC = Math.cos(toRadians(c));
  const sinBside = Math.sin(toRadians(b));
  const cosBside = Math.cos(toRadians(b));

  const R = Math.hypot(cosC, sinC * Math.cos(toRadians(B)));
  if (R < 1e-12) return NaN;

  let x = cosBside / R;
  x = Math.min(1, Math.max(-1, x));

  const alpha = toDegrees(Math.atan2(sinC * Math.cos(toRadians(B)), cosC));
  const delta = toDegrees(Math.acos(x));

  const candidateSides = [alpha + delta, alpha - delta]
    .map(normalizeAngle)
    .filter(a => a >= -1e-12 && a <= 180 + 1e-12);

  if (candidateSides.length === 0) return NaN;

  const a = candidateSides[0]!;
  const denom = sinBside * Math.sin(toRadians(c));
  if (Math.abs(denom) < 1e-12) return NaN;

  let cosP = (Math.cos(toRadians(a)) - cosBside * cosC) / denom;
  cosP = Math.min(1, Math.max(-1, cosP));

  return toDegrees(Math.acos(cosP));
}

/**
 * Calculates the exact UTC times when the sun aligns with the Qibla direction,
 * as well as its three 90°/180° perpendicular offsets.
 *
 * @remarks
 * Uses an analytical intersection of the PZX spherical triangle combined with
 * high-precision internal ephemeris to determine when the sun's azimuth matches
 * the direction of the Kaaba from the observer's location.
 *
 * @param config - The configuration object containing location and date.
 * @returns The precise times of alignment, or null if the sun never reaches that azimuth.
 */
export function getSunAtQibla(config: SunAlignmentConfig): SunAtQiblaResult {
  const { latitude, longitude, date = new Date(), timeZone } = config;
  validateCoordinates(latitude, longitude);

  // 1. Get Qibla Direction
  const qiblaResult = getQiblaDirection({ latitude, longitude });
  if (qiblaResult.bearing === null) {
    // Exactly at Kaaba, direction is undefined
    return {
      qiblaAlignment: null,
      antiQiblaAlignment: null,
      rightPerpendicularAlignment: null,
      leftPerpendicularAlignment: null,
    };
  }
  const bearing = qiblaResult.bearing;

  // 2. Compute Solar Noon and Declination directly using astronomy ephemeris
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const j0 = dateToJulianDay(year, month, day);
  const deltaT = calculateDeltaT(year);

  const solarCache = new Map<number, SolarPositionResult>();
  const getCachedSolar = (ut: number): SolarPositionResult => {
    const key = Math.round(ut * 1e6);
    let pos = solarCache.get(key);
    if (!pos) {
      pos = computeSolarPosition(j0, ut, deltaT);
      solarCache.set(key, pos);
    }
    return pos;
  };

  // Initial estimate of noon UT
  let transitUt = 12 - longitude / 15;
  let solarTransit: SolarPositionResult;

  // Iterate to find exact solar transit based on Equation of Time
  for (let i = 0; i < 3; i++) {
    solarTransit = getCachedSolar(transitUt);
    transitUt = 12 - longitude / 15 - solarTransit.equationOfTime / 60;
  }

  const sunDecAtNoon = solarTransit!.declination;
  const eqTAtNoon = solarTransit!.equationOfTime;

  const offsets = [
    { key: 'qiblaAlignment', value: 0 },
    { key: 'antiQiblaAlignment', value: 180 },
    { key: 'rightPerpendicularAlignment', value: 90 },
    { key: 'leftPerpendicularAlignment', value: -90 },
  ] as const;

  const result: Record<string, SolarTimeField | null> = {
    qiblaAlignment: null,
    antiQiblaAlignment: null,
    rightPerpendicularAlignment: null,
    leftPerpendicularAlignment: null,
  };

  const zuhrDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  offsets.forEach(offset => {
    const currentDir = normalizeAngle(bearing + offset.value);

    let currentDec = sunDecAtNoon;
    let currentEqT = eqTAtNoon;
    let eventUt = transitUt;
    let isSolvable = false;

    // Iterate to find exact event time by refining Declination and Equation of Time
    for (let iter = 0; iter < 4; iter++) {
      const PZ = 90 - latitude;
      const PS = 90 - currentDec;
      const angleP = calculatePolarAngleP(PZ, PS, currentDir);

      if (isNaN(angleP)) {
        isSolvable = false;
        break; // Unsolvable at this declination (e.g. polar regions)
      }

      isSolvable = true;
      const timeOffset = angleP / 15;

      const baseNoonUt = 12 - longitude / 15 - currentEqT / 60;
      eventUt = currentDir > 180 ? baseNoonUt + timeOffset : baseNoonUt - timeOffset;

      // Re-evaluate solar position exactly at the newly estimated event time
      const eventSolar = getCachedSolar(eventUt);
      currentDec = eventSolar.declination;
      currentEqT = eventSolar.equationOfTime;
    }

    if (isSolvable) {
      const finalTimeDecimal = eventUt;

      const time = new Date(zuhrDate.getTime());

      const hours = Math.floor(finalTimeDecimal);
      const minutes = Math.floor((finalTimeDecimal - hours) * 60);
      const seconds = Math.floor(((finalTimeDecimal - hours) * 60 - minutes) * 60);

      time.setUTCHours(hours, minutes, seconds, 0);

      result[offset.key] = {
        time,
        local: formatLocalTime(time, timeZone),
      };
    }
  });

  solarCache.clear();
  return result as unknown as SunAtQiblaResult;
}

function formatLocalTime(
  date: Date,
  timeZone?: string | number,
  onFallback?: (reason: string) => void
): string {
  if (timeZone === undefined) {
    return date.toISOString();
  }

  try {
    if (typeof timeZone === 'string') {
      const parsedOffset = parseFloat(timeZone);
      if (!isNaN(parsedOffset)) {
        return formatManualOffset(date, parsedOffset);
      }
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone,
      }).format(date);
    } else {
      return formatManualOffset(date, timeZone);
    }
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    onFallback?.(`Intl format failed (${reason}); using ISO string fallback`);
    return date.toISOString();
  }
}

function formatManualOffset(date: Date, offsetHours: number): string {
  const localTime = new Date(date.getTime() + offsetHours * 3600000);
  const hours = localTime.getUTCHours();
  const minutes = localTime.getUTCMinutes();
  const seconds = localTime.getUTCSeconds();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(displayHours)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
}
