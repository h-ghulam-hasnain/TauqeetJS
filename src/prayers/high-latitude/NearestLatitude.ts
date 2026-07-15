import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';
import { calculateFajr } from '../calculations/Fajr.js';
import { calculateMaghrib, calculateSunset } from '../calculations/Maghrib.js';
import { calculateIsha } from '../calculations/Isha.js';

export class NearestLatitudeStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'NearestLatitude';

  apply(ctx: Readonly<HighLatitudeContext>): Partial<Readonly<HighLatitudeContext>> {
    const sign = ctx.latitude < 0 ? -1 : 1;
    const anchorLat = sign * ctx.regionalFallbackLatitude;

    const fajrRes = calculateFajr(ctx.baseDate, anchorLat, ctx.longitude, ctx.method);
    const fajr = fajrRes ? fajrRes.time : null;

    // To compute Isha, we first need Sunset and Maghrib at the anchor latitude
    const sunsetRes = calculateSunset(
      ctx.baseDate,
      anchorLat,
      ctx.longitude,
      ctx.elevationMeters,
      ctx.temperatureC,
      ctx.pressureMbar
    );
    const maghribRes = calculateMaghrib(
      ctx.baseDate,
      anchorLat,
      ctx.longitude,
      ctx.elevationMeters,
      ctx.temperatureC,
      ctx.pressureMbar,
      ctx.method,
      sunsetRes
    );

    const ishaRes = calculateIsha(ctx.baseDate, anchorLat, ctx.longitude, ctx.method, maghribRes);
    const isha = ishaRes ? ishaRes.time : null;

    return { fajr, isha };
  }
}
