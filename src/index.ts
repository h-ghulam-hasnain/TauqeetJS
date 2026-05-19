/**
 * Tauqeet.js - High-precision Islamic prayer times and astronomical library.
 * Modular, tree-shakable public surface; ephemeris core is internal-only.
 */

export { Success, Failure, validateInputs, ErrorCode, ValidationError, Result } from './core/result.js';
export type { Result as ResultType } from './core/result.js';

export {
  getPrayerTimes,
  getPrayerTimes as calculate,
  getMonthlyPrayerTimes,
  getRamadanSchedule
} from './prayer/index.js';
export type { PrayerConfig } from './prayer/index.js';
export * from './prayer/types/index.js';

export { calculateQibla, calculateSunAtQibla } from './qibla/index.js';

export {
  getMoonVisibility,
  getMoonVisibility as getMoonTimes,
  calculateMoonPosition,
  calculateMoonDiskAnalytics,
  calculateMoonAlmanac
} from './moon-visibility/index.js';
export type { MoonVisibilityResult, MoonInput, DateTimeDetails } from './moon-visibility/types.js';

export { createPrayerEngine, type PrayerEngineApi, createMoonEngine, type MoonEngineApi } from './factory/index.js';

