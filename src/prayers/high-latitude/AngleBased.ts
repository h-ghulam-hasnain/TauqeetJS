import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';
import { getSafeNightDuration } from './utils.js';

export class AngleBasedStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'AngleBased';

  computeFajr(ctx: HighLatitudeContext): Date | null {
    const night = getSafeNightDuration(ctx);
    if (!night) return null;
    const { safeSunrise, nightDurationMs } = night;

    const fajrAngle = ctx.method.fajrAngle;
    const fajrPortion = nightDurationMs * (fajrAngle / 60);
    return new Date(safeSunrise.getTime() - fajrPortion);
  }

  computeIsha(ctx: HighLatitudeContext): Date | null {
    const night = getSafeNightDuration(ctx);
    if (!night) return null;
    const { safeSunset, nightDurationMs } = night;

    const ishaAngle = ctx.method.ishaAngle ?? 18; // Fallback to 18 if null (e.g. Umm al-Qura)
    const ishaPortion = nightDurationMs * (ishaAngle / 60);
    return new Date(safeSunset.getTime() + ishaPortion);
  }
}
