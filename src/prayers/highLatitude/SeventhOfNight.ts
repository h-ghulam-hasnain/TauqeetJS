import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';

export class SeventhOfNightStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'SeventhOfNight';

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
    const { safeSunrise, nightDuration } = this.getNightDuration(ctx);
    const seventhNight = nightDuration / 7;
    return new Date(safeSunrise.getTime() - seventhNight);
  }

  computeIsha(ctx: HighLatitudeContext): Date | null {
    const { safeSunset, nightDuration } = this.getNightDuration(ctx);
    const seventhNight = nightDuration / 7;
    return new Date(safeSunset.getTime() + seventhNight);
  }
}
