import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { getPrayerTimesLegacy } from '../../src/prayers/legacy.js';;
import type { PrayerTimesResult } from '../../src/prayers/types/index.js';

type HighLatitudeStrategy = 'AngleBased' | 'MiddleOfNight' | 'SeventhOfNight' | 'NearestLatitude';

type PrayerField =
  | PrayerTimesResult['fajr']
  | PrayerTimesResult['sunrise']
  | PrayerTimesResult['asr']
  | PrayerTimesResult['maghrib']
  | PrayerTimesResult['isha'];

type MatrixCase = {
  readonly label: string;
  readonly lat: number;
  readonly long: number;
  readonly date: Date;
  readonly strategy: HighLatitudeStrategy;
};

const latitudes = [62.0, 66.5, 72.0, 85.0, 89.9, -62.0, -66.5, -72.0, -85.0, -89.9] as const;
const longitudes = [-120.0, 0.0, 45.0, 90.0, 180.0] as const;
const keyDates = [
  { label: 'Summer Solstice', date: new Date(Date.UTC(2024, 5, 21)) },
  { label: 'Winter Solstice', date: new Date(Date.UTC(2024, 11, 21)) },
  { label: 'Spring Equinox', date: new Date(Date.UTC(2024, 2, 21)) },
  { label: 'Autumnal Equinox', date: new Date(Date.UTC(2024, 8, 22)) },
] as const;
const strategies: readonly HighLatitudeStrategy[] = ['AngleBased', 'MiddleOfNight', 'SeventhOfNight', 'NearestLatitude'];

function runPrayerTimes(config: {
  readonly lat: number;
  readonly long: number;
  readonly date: Date;
  readonly highLatitudeStrategy?: HighLatitudeStrategy;
}) {
  const configWithMetadata = { ...config, withMetadata: true };
  const startedAt = performance.now();
  const result = getPrayerTimesLegacy(configWithMetadata);
  const durationMs = performance.now() - startedAt;
  return { result, durationMs };
}

function assertFiniteTimeField(field: PrayerField) {
  if (field.timestamp === null) {
    expect(['SUCCESS', 'POLAR_DAY', 'POLAR_NIGHT', 'CONTINUOUS_TWILIGHT', 'ASTRONOMICAL_MIDNIGHT', 'REGIONAL_FALLBACK']).toContain(field.status);
    return;
  }

  expect(Number.isFinite(field.timestamp)).toBe(true);
  expect(field.timestamp).toBeGreaterThan(0);
}

function assertSolverGuardrail(result: PrayerTimesResult) {
  const metadata = result.metadata;
  if (!metadata) return;

  const iterationsByField = [metadata.fajr?.iterations, metadata.sunrise?.iterations, metadata.asr?.iterations, metadata.maghrib?.iterations, metadata.isha?.iterations];

  for (const iterations of iterationsByField) {
    if (iterations === undefined) continue;
    expect(iterations).toBeGreaterThan(0);
    expect(iterations).toBeLessThanOrEqual(15);
  }
}

function assertConditionalPrayerTimeSafety(result: PrayerTimesResult, strategy: HighLatitudeStrategy) {
  expect(strategy).toBeTruthy();

  for (const field of [result.fajr, result.isha] as const) {
    const fallbackStatuses = ['POLAR_DAY', 'POLAR_NIGHT', 'CONTINUOUS_TWILIGHT', 'ASTRONOMICAL_MIDNIGHT', 'REGIONAL_FALLBACK', 'SUCCESS'] as const;

    if (field.timestamp === null) {
      expect(fallbackStatuses).toContain(field.status);
      continue;
    }

    expect(Number.isFinite(field.timestamp)).toBe(true);
    expect(field.timestamp).toBeGreaterThan(0);
  }
}

function buildMatrix(): readonly MatrixCase[] {
  const matrix: MatrixCase[] = [];

  for (const lat of latitudes) {
    for (const long of longitudes) {
      for (const keyDate of keyDates) {
        for (const strategy of strategies) {
          matrix.push({
            label: `${lat >= 0 ? 'N' : 'S'}${Math.abs(lat)} / ${long} / ${keyDate.label} / ${strategy}`,
            lat,
            long,
            date: keyDate.date,
            strategy,
          });
        }
      }
    }
  }

  return matrix;
}

describe('tauqeet-js high-latitude convergence and stability', () => {
  it('runs an aggressive matrix over latitude, longitude, date, and strategy combinations', () => {
    const matrix = buildMatrix();

    expect(matrix).toHaveLength(800);

    for (const testCase of matrix) {
      const { result, durationMs } = runPrayerTimes({
        lat: testCase.lat,
        long: testCase.long,
        date: testCase.date,
        highLatitudeStrategy: testCase.strategy,
      });

      const isBoundaryInvalid = testCase.long === 180 || testCase.long === -180 || testCase.lat === 90 || testCase.lat === -90;
      if (isBoundaryInvalid) {
        expect(result.success, testCase.label).toBe(false);
        continue;
      }

      expect(result.success, testCase.label).toBe(true);
      expect(durationMs, testCase.label).toBeGreaterThanOrEqual(0);
      expect(durationMs, testCase.label).toBeLessThan(30000);

      if (!result.success) continue;

      assertSolverGuardrail(result.data);
      assertFiniteTimeField(result.data.dhuhr);
      assertConditionalPrayerTimeSafety(result.data, testCase.strategy);
    }
  }, 20000);

  it('rejects the absolute latitude limit while preserving stable boundary behavior near the pole', () => {
    const atPole = runPrayerTimes({ lat: 90, long: 0, date: new Date(Date.UTC(2024, 5, 21)) });
    expect(atPole.result.success).toBe(false);

    const nearPole = runPrayerTimes({ lat: 89.9, long: 0, date: new Date(Date.UTC(2024, 5, 21)) });
    expect(nearPole.result.success).toBe(true);
  }, 20000);

  it('returns bounded polar-day and polar-night statuses at extreme northern and southern latitudes', () => {
    const summerNorth = runPrayerTimes({ lat: 75, long: 0, date: new Date(Date.UTC(2024, 5, 21)) });
    const winterSouth = runPrayerTimes({ lat: -75, long: 0, date: new Date(Date.UTC(2024, 5, 21)) });
    const winterNorth = runPrayerTimes({ lat: 75, long: 0, date: new Date(Date.UTC(2024, 11, 21)) });
    const summerSouth = runPrayerTimes({ lat: -75, long: 0, date: new Date(Date.UTC(2024, 11, 21)) });

    expect(summerNorth.result.success).toBe(true);
    expect(winterSouth.result.success).toBe(true);
    expect(winterNorth.result.success).toBe(true);
    expect(summerSouth.result.success).toBe(true);

    if (!summerNorth.result.success || !winterSouth.result.success || !winterNorth.result.success || !summerSouth.result.success) {
      throw new Error('Expected extreme-latitude runs to return success');
    }

    expect(summerNorth.result.data.sunrise.status).toBe('POLAR_DAY');
    expect(winterSouth.result.data.sunrise.status).toBe('POLAR_NIGHT');
    expect(winterNorth.result.data.sunrise.status).toBe('POLAR_NIGHT');
    expect(summerSouth.result.data.sunrise.status).toBe('POLAR_DAY');

    expect(summerNorth.result.data.dhuhr.status).toBe('SUCCESS');
    expect(winterSouth.result.data.dhuhr.status).toBe('POLAR_NIGHT');
    expect(winterNorth.result.data.dhuhr.status).toBe('POLAR_NIGHT');
    expect(summerSouth.result.data.dhuhr.status).toBe('SUCCESS');

    expect(summerNorth.result.data.dhuhr.timestamp).not.toBeNull();
    expect(winterNorth.result.data.dhuhr.timestamp).toBeNull();
    expect(winterSouth.result.data.dhuhr.timestamp).toBeNull();
    expect(summerSouth.result.data.dhuhr.timestamp).not.toBeNull();

    expect(summerNorth.result.data.fajr.timestamp).toBeNull();
    expect(winterNorth.result.data.fajr.timestamp).toBeNull();
    expect(winterSouth.result.data.fajr.timestamp).toBeNull();
    expect(summerSouth.result.data.fajr.timestamp).toBeNull();
  });

  it('stays finite and bounded when using continuous-twilight fallback strategies', () => {
    const { result, durationMs } = runPrayerTimes({
      lat: 66.5,
      long: 0,
      date: new Date(Date.UTC(2024, 5, 21)),
      highLatitudeStrategy: 'MiddleOfNight',
    });

    expect(result.success).toBe(true);
    expect(durationMs).toBeLessThan(30000);

    if (!result.success) return;

    const { fajr, isha, sunrise, maghrib } = result.data;
    expect(fajr.timestamp === null || Number.isFinite(fajr.timestamp)).toBe(true);
    expect(isha.timestamp === null || Number.isFinite(isha.timestamp)).toBe(true);
    expect(sunrise.timestamp === null || Number.isFinite(sunrise.timestamp)).toBe(true);
    expect(maghrib.timestamp === null || Number.isFinite(maghrib.timestamp)).toBe(true);
  });

  it('produces stable outputs across repeated evaluations for the same high-latitude case', () => {
    const first = runPrayerTimes({ lat: 75, long: 0, date: new Date(Date.UTC(2024, 5, 21)) });
    const second = runPrayerTimes({ lat: 75, long: 0, date: new Date(Date.UTC(2024, 5, 21)) });

    expect(first.result.success).toBe(true);
    expect(second.result.success).toBe(true);

    if (!first.result.success || !second.result.success) return;

    const firstTime = first.result.data.dhuhr.timestamp;
    const secondTime = second.result.data.dhuhr.timestamp;

    expect(firstTime).not.toBeNull();
    expect(secondTime).not.toBeNull();
    expect(Math.abs((firstTime ?? 0) - (secondTime ?? 0))).toBe(0);
  });
});
