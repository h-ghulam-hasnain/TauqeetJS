import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';
import { calculateSunrise } from '../calculations/Sunrise.js';
import { getSafeNightDuration } from './utils.js';

export class MiddleOfNightStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'MiddleOfNight';

  private getNextSunrise(ctx: HighLatitudeContext): Date | null {
    const nextDate = new Date(
      Date.UTC(
        ctx.baseDate.getUTCFullYear(),
        ctx.baseDate.getUTCMonth(),
        ctx.baseDate.getUTCDate() + 1,
        0,
        0,
        0,
        0
      )
    );

    const nextSunrise = calculateSunrise(
      nextDate,
      ctx.latitude,
      ctx.longitude,
      ctx.elevationMeters,
      ctx.temperatureC,
      ctx.pressureMbar
    );

    return nextSunrise?.time ?? null;
  }

  computeFajr(ctx: HighLatitudeContext): Date | null {
    const night = getSafeNightDuration(ctx);
    if (!night) return null;
    const { safeSunrise, safeSunset, nightDurationMs } = night;

    const nextSunrise = this.getNextSunrise(ctx);
    if (nextSunrise) {
      const diff = nextSunrise.getTime() - safeSunset.getTime();
      // Defensive check to avoid NaN, negative splits, or crossing over another day
      if (!Number.isNaN(diff) && diff > 0 && diff <= 24 * 3600000) {
        return new Date(safeSunset.getTime() + diff / 2);
      }
    }

    const halfNight = nightDurationMs / 2;
    return new Date(safeSunrise.getTime() - halfNight);
  }

  computeIsha(ctx: HighLatitudeContext): Date | null {
    const night = getSafeNightDuration(ctx);
    if (!night) return null;
    const { safeSunset, nightDurationMs } = night;

    const halfNight = nightDurationMs / 2;
    return new Date(safeSunset.getTime() + halfNight);
  }
}
