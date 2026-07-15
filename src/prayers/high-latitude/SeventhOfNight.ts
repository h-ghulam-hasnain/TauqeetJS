import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';
import { getSafeNightDuration } from './utils.js';

export class SeventhOfNightStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'SeventhOfNight';

  computeFajr(ctx: HighLatitudeContext): Date | null {
    const night = getSafeNightDuration(ctx);
    if (!night) return null;
    const { safeSunrise, nightDurationMs } = night;

    const seventhNight = nightDurationMs / 7;
    return new Date(safeSunrise.getTime() - seventhNight);
  }

  computeIsha(ctx: HighLatitudeContext): Date | null {
    const night = getSafeNightDuration(ctx);
    if (!night) return null;
    const { safeSunset, nightDurationMs } = night;

    const seventhNight = nightDurationMs / 7;
    return new Date(safeSunset.getTime() + seventhNight);
  }
}
