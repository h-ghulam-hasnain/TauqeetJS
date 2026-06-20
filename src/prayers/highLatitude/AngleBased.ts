import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';

export class AngleBasedStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'AngleBased';

  private getNightDuration(ctx: HighLatitudeContext): {
    safeSunrise: Date;
    safeSunset: Date;
    nightDuration: number;
  } {
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
    const fajrAngle = ctx.method.fajrAngle;
    const fajrPortion = nightDuration * (fajrAngle / 60);
    return new Date(safeSunrise.getTime() - fajrPortion);
  }

  computeIsha(ctx: HighLatitudeContext): Date | null {
    const { safeSunset, nightDuration } = this.getNightDuration(ctx);
    const ishaAngle = ctx.method.ishaAngle ?? 18; // Fallback to 18 if null (e.g. Umm al-Qura)
    const ishaPortion = nightDuration * (ishaAngle / 60);
    return new Date(safeSunset.getTime() + ishaPortion);
  }
}
