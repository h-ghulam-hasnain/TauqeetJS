/**
 * Precision Astro-Prayer Library
 * Modularized for high-precision astronomy, prayer times, and Qibla.
 */

// Core Utilities
export * from './core/math.js';
export * from './core/time.js';

// Qibla
export * from './qibla/index.js';

// Prayer
export * from './prayer/index.js';

// High-level Modules Namespace
import * as Astronomy from './astronomy/index.js';
import * as PrayerTimes from './prayer/index.js';
import * as QiblaModule from './qibla/index.js';
import * as Moon from './moon/index.js';

export { Astronomy, PrayerTimes, QiblaModule as Qibla, Moon };

// Low-Code Alias
import { getPrayerTimes } from './prayer/calculate.js';
import { getMoonTimes } from './moon/index.js';
export { getPrayerTimes as calculate, getMoonTimes };

// UI Renderer
export { renderPrayerChart } from './ui/render.js';
