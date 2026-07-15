import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';
import { getSafeNightDuration } from './utils.js';

export class SeventhOfNightStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'SeventhOfNight';

  apply(ctx: Readonly<HighLatitudeContext>): Partial<Readonly<HighLatitudeContext>> {
    const night = getSafeNightDuration(ctx);
    if (!night) return {};
    const { safeSunrise, safeSunset, nightDurationMs } = night;

    const seventhNight = nightDurationMs / 7;
    const fajr = new Date(safeSunrise.getTime() - seventhNight);
    const isha = new Date(safeSunset.getTime() + seventhNight);

    return { fajr, isha };
  }
}
