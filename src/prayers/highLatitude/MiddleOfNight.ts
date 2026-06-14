import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';
import { calculateSunrise } from '../calculations/Sunrise.js';

export class MiddleOfNightStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'MiddleOfNight';

  private getNextSunrise(ctx: HighLatitudeContext): Date | null {
    const nextDate = new Date(Date.UTC(
      ctx.baseDate.getUTCFullYear(),
      ctx.baseDate.getUTCMonth(),
      ctx.baseDate.getUTCDate() + 1,
      0,
      0,
      0,
      0
    ));

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

  private getNightDuration(ctx: HighLatitudeContext): { safeSunrise: Date; safeSunset: Date; nightDuration: number } {
    const safeDhuhr = ctx.dhuhr ?? new Date(ctx.baseDate.getTime());
    const safeSunrise = ctx.sunrise ?? new Date(safeDhuhr.getTime() - 6 * 3600000);
    const safeSunset = ctx.sunset ?? new Date(safeDhuhr.getTime() + 6 * 3600000);

    let sunriseTime = safeSunrise.getTime();
    if (sunriseTime < safeSunset.getTime()) {
      sunriseTime += 24 * 3600000;
    }
    const nightDuration = sunriseTime - safeSunset.getTime();
    return { safeSunrise, safeSunset, nightDuration };
  }

  computeFajr(ctx: HighLatitudeContext): Date | null {
    const safeSunset = ctx.sunset ?? new Date((ctx.dhuhr ?? ctx.baseDate).getTime() + 6 * 3600000);
    const nextSunrise = this.getNextSunrise(ctx);
    if (nextSunrise) {
      return new Date(safeSunset.getTime() + (nextSunrise.getTime() - safeSunset.getTime()) / 2);
    }

    const { safeSunrise, nightDuration } = this.getNightDuration(ctx);
    const halfNight = nightDuration / 2;
    return new Date(safeSunrise.getTime() - halfNight);
  }

  computeIsha(ctx: HighLatitudeContext): Date | null {
    const { safeSunset, nightDuration } = this.getNightDuration(ctx);
    const halfNight = nightDuration / 2;
    return new Date(safeSunset.getTime() + halfNight);
  }
}
