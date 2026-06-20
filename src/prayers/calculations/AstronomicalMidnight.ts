import { calculateSunrise } from './Sunrise.js';
import { calculateSunset } from './Maghrib.js';

/**
 * Calculates Astronomical Midnight — the exact midpoint between
 * the previous civil day's sunset and today's sunrise.
 *
 * Formula:
 *   midnight = previousDaySunset + (sunriseToday - previousDaySunset) / 2
 *
 * @param date         The current prayer date (UTC-normalised).
 * @param latitude     Observer latitude in degrees.
 * @param longitude    Observer longitude in degrees.
 * @param elevationMeters  Elevation above sea level in metres.
 * @param temperatureC Ambient temperature in °C.
 * @param pressureMbar Atmospheric pressure in mbar.
 * @returns            A Date representing Astronomical Midnight, or null if
 *                     either sunrise or the previous day's sunset cannot be
 *                     determined.
 */
export function calculateAstronomicalMidnight(
  date: Date,
  latitude: number,
  longitude: number,
  elevationMeters: number,
  temperatureC: number,
  pressureMbar: number
): Date | null {
  // ── Step 1: Today's sunrise ─────────────────────────────────────────────
  const sunriseResult = calculateSunrise(
    date,
    latitude,
    longitude,
    elevationMeters,
    temperatureC,
    pressureMbar
  );
  if (!sunriseResult?.time || isNaN(sunriseResult.time.getTime())) return null;
  const sunriseMs = sunriseResult.time.getTime();

  // ── Step 2: Previous civil day's sunset ─────────────────────────────────
  const previousDate = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - 1 // one calendar day back
    )
  );
  const prevSunsetResult = calculateSunset(
    previousDate,
    latitude,
    longitude,
    elevationMeters,
    temperatureC,
    pressureMbar
  );
  if (!prevSunsetResult?.time || isNaN(prevSunsetResult.time.getTime())) return null;
  const prevSunsetMs = prevSunsetResult.time.getTime();

  // ── Step 3: Midpoint (millisecond-precision) ────────────────────────────
  // midnight = prevSunset + (sunriseToday − prevSunset) / 2
  const midpointMs = prevSunsetMs + (sunriseMs - prevSunsetMs) / 2;
  return new Date(midpointMs);
}
