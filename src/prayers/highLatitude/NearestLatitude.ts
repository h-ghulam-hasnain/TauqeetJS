import type { HighLatitudeStrategy, HighLatitudeContext } from './HighLatitudeStrategy.js';
import { calculateFajr } from '../calculations/Fajr.js';
import { calculateMaghrib, calculateSunset } from '../calculations/Maghrib.js';
import { calculateIsha } from '../calculations/Isha.js';

export class NearestLatitudeStrategy implements HighLatitudeStrategy {
  readonly strategyName = 'NearestLatitude';

  computeFajr(ctx: HighLatitudeContext): Date | null {
    const sign = ctx.latitude < 0 ? -1 : 1;
    const anchorLat = sign * ctx.regionalFallbackLatitude;

    const res = calculateFajr(ctx.baseDate, anchorLat, ctx.longitude, ctx.method);
    return res ? res.time : null;
  }

  computeIsha(ctx: HighLatitudeContext): Date | null {
    const sign = ctx.latitude < 0 ? -1 : 1;
    const anchorLat = sign * ctx.regionalFallbackLatitude;

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

    const res = calculateIsha(ctx.baseDate, anchorLat, ctx.longitude, ctx.method, maghribRes);
    return res ? res.time : null;
  }
}
