import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';
import { getSafeNightDuration } from './utils.js';

export class AngleBasedStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'AngleBased';

  apply(ctx: Readonly<HighLatitudeContext>): Partial<Readonly<HighLatitudeContext>> {
    const night = getSafeNightDuration(ctx);
    if (!night) return {};
    const { safeSunrise, safeSunset, nightDurationMs } = night;

    const fajrAngle = ctx.method.fajrAngle;
    const fajrPortion = nightDurationMs * (fajrAngle / 60);
    const fajr = new Date(safeSunrise.getTime() - fajrPortion);

    const ishaAngle = ctx.method.ishaAngle ?? 18; // Fallback to 18 if null (e.g. Umm al-Qura)
    const ishaPortion = nightDurationMs * (ishaAngle / 60);
    const isha = new Date(safeSunset.getTime() + ishaPortion);

    return { fajr, isha };
  }
}
