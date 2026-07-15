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

  apply(ctx: Readonly<HighLatitudeContext>): Partial<Readonly<HighLatitudeContext>> {
    const night = getSafeNightDuration(ctx);
    if (!night) return {};
    const { safeSunrise, safeSunset, nightDurationMs } = night;

    let fajr: Date | null = null;
    const nextSunrise = this.getNextSunrise(ctx);
    if (nextSunrise) {
      const diff = nextSunrise.getTime() - safeSunset.getTime();
      // Defensive check to avoid NaN, negative splits, or crossing over another day
      if (!Number.isNaN(diff) && diff > 0 && diff <= 24 * 3600000) {
        fajr = new Date(safeSunset.getTime() + diff / 2);
      }
    }

    const halfNight = nightDurationMs / 2;
    if (!fajr) {
      fajr = new Date(safeSunrise.getTime() - halfNight);
    }

    const isha = new Date(safeSunset.getTime() + halfNight);

    return { fajr, isha };
  }
}
