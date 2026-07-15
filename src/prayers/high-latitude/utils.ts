import type { HighLatitudeContext } from './HighLatitudeStrategy.js';

/**
 * Robustly calculates the duration of the night for high-latitude fallbacks.
 * 
 * In polar regions (Midnight Sun / Polar Night), astronomical sunrise and sunset
 * do not occur, returning `null`. This utility safely falls back to a 12-hour
 * night centered around local solar noon (Dhuhr) or, if Dhuhr is also unavailable,
 * around the mathematical geographic noon.
 */
export function getSafeNightDuration(ctx: HighLatitudeContext): { safeSunrise: Date; safeSunset: Date; nightDurationMs: number } | null {
  let safeDhuhr = ctx.dhuhr;

  // Fallback 1: If Dhuhr is null (extreme polar boundary), estimate local solar noon.
  if (!safeDhuhr) {
    const approxNoonUTC = 12 - (ctx.longitude / 15);
    const approxNoonHours = Math.floor(approxNoonUTC);
    const approxNoonMinutes = Math.floor((approxNoonUTC - approxNoonHours) * 60);
    const approxNoonSeconds = Math.floor((((approxNoonUTC - approxNoonHours) * 60) - approxNoonMinutes) * 60);

    safeDhuhr = new Date(Date.UTC(
      ctx.baseDate.getUTCFullYear(),
      ctx.baseDate.getUTCMonth(),
      ctx.baseDate.getUTCDate(),
      approxNoonHours,
      approxNoonMinutes,
      approxNoonSeconds
    ));
  }

  // Fallback 2: If sunrise/sunset are null, assume 6 AM / 6 PM relative to Dhuhr
  const safeSunrise = ctx.sunrise ?? new Date(safeDhuhr.getTime() - 6 * 3600000);
  const safeSunset = ctx.sunset ?? new Date(safeDhuhr.getTime() + 6 * 3600000);

  let sunriseTime = safeSunrise.getTime();
  const sunsetTime = safeSunset.getTime();

  // The night is the duration from sunset today until sunrise tomorrow.
  // Since ctx.sunrise is usually today's sunrise, it's typically before sunset.
  if (sunriseTime < sunsetTime) {
    sunriseTime += 24 * 3600000;
  }

  const nightDurationMs = sunriseTime - sunsetTime;

  // Defensive Check: No negative, NaN, or > 24hr nights
  if (Number.isNaN(nightDurationMs) || nightDurationMs <= 0 || nightDurationMs > 24 * 3600000) {
    return null;
  }

  return { safeSunrise, safeSunset, nightDurationMs };
}
