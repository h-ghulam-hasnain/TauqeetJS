import { createPrayerEngine as createPrayerEngineImpl } from '../prayer/engine.js';
import type { CalculationMethod, Coordinates } from '../prayer/types/index.js';

/**
 * Public prayer engine: only the `calculate` surface is exposed so closure state stays private.
 */
export type PrayerEngineApi = Pick<
  ReturnType<typeof createPrayerEngineImpl>,
  'calculate'
>;

export function createPrayerEngine(
  coords: Coordinates,
  method: CalculationMethod = 'Karachi'
): PrayerEngineApi {
  return createPrayerEngineImpl(coords, method);
}
