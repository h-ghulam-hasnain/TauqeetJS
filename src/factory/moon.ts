import { getMoonVisibility } from '../moon-visibility/index.js';
import type { MoonVisibilityResult } from '../moon-visibility/types.js';
import type { Coordinates } from '../prayer/types/index.js';
import type { Result } from '../core/result.js';

export interface MoonEngineApi {
  calculate: (date: Date) => Result<MoonVisibilityResult>;
}

/**
 * Public moon visibility engine: stateless wrapper.
 */
export function createMoonEngine(coords: Coordinates): MoonEngineApi {
  return {
    calculate: (date: Date) => getMoonVisibility(date, coords.latitude, coords.longitude)
  };
}
