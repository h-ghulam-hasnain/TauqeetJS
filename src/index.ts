/**
 * Tauqeet.js - High-precision Islamic prayer times and astronomical library.
 * Modern, Modular, and Private.
 * Headless-first entry point.
 */

// Core Result and Validation
export { Success, Failure, validateInputs } from './core/result.js';
export type { Result } from './core/result.js';

// Prayer API
export { 
  getPrayerTimes, 
  getPrayerTimes as calculate,
  getMonthlyPrayerTimes,
  getRamadanSchedule 
} from './prayer/index.js';
export type { PrayerConfig } from './prayer/index.js';
export * from './prayer/types/index.js';

// Qibla API
export { calculateQibla, calculateSunAtQibla } from './qibla/index.js';

// Moon API
export { getMoonTimes, createMoonEngine } from './moon/index.js';

// Factory pattern exposure for engines
export { createPrayerEngine } from './prayer/engine.js';

// Astronomy API
export * from './astronomy/index.js';
