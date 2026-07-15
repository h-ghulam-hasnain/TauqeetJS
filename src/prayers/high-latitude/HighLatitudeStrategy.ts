import type { PrayerMethodConfig } from '../types/index.js';

export interface HighLatitudeContext {
  readonly baseDate: Date;
  readonly sunrise: Date | null;
  readonly sunset: Date | null;
  readonly maghrib: Date | null;
  readonly dhuhr: Date | null;
  readonly method: PrayerMethodConfig;
  readonly latitude: number;
  readonly longitude: number;
  readonly elevationMeters: number;
  readonly temperatureC: number;
  readonly pressureMbar: number;
  readonly regionalFallbackLatitude: number;
  readonly fajr: Date | null;
  readonly isha: Date | null;
}

export interface HighLatitudeStrategy {
  readonly strategyName: string;
  apply(ctx: Readonly<HighLatitudeContext>): Partial<Readonly<HighLatitudeContext>>;
}
