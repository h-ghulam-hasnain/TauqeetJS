/**
 * Precision Astro-Prayer Library
 * Modularized for high-precision astronomy, prayer times, and Qibla.
 */

// Core Utilities
export * from './core/math.js';
export * from './core/time.js';

// High-level Modules
export * as Astronomy from './astronomy/index.js';
export * as PrayerTimes from './prayer/index.js';
export * as Qibla from './qibla/index.js';

// Re-export specific common types and classes for convenience
export { Coordinates, CalculationMethod, PrayerTimesResult, PRESETS } from './prayer/types.js';
export { PrayerEngine, getPrayerTimes, PrayerConfig } from './prayer/index.js';
export { Astronomy as AstronomyClass } from './astronomy/index.js';
export { calculateQibla } from './qibla/index.js';

// Ultimate Low-Code Alias
export { getPrayerTimes as calculate } from './prayer/index.js';
