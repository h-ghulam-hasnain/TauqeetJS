import { MoonEngine, MoonRiseSetResult } from './engine.js';
import { Coordinates } from '../prayer/types.js';

/**
 * Calculates Moon Rise, Set, and Transit times for a given date and location.
 */
export function getMoonTimes(date: Date, latitude: number, longitude: number): MoonRiseSetResult {
    const coords: Coordinates = { latitude, longitude };
    const engine = new MoonEngine(coords);
    return engine.calculate(date);
}

export { MoonEngine };
export type { MoonRiseSetResult };
