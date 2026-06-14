export type { MoonAgeResult } from './types/MoonAge.js';
export type { MoonEventResult } from './types/MoonEvent.js';
export type { MoonPhaseResult } from './types/MoonPhase.js';
export type { VisibilityInput, VisibilityResult } from './types/MoonVisibility.js';
export { VisibilityMethod } from './types/MoonVisibility.js';

export { getMoonPhase } from './phase/MoonPhase.js';
export { getMoonAge } from './phase/MoonAge.js';
export { getMoonIllumination } from './phase/MoonIllumination.js';

export { getNextNewMoon, getPreviousNewMoon, getNextFullMoon, getPreviousFullMoon } from './events/LunarEvents.js';

export type { VisibilityCriterion } from './visibility/VisibilityCriteria.js';
export { OdehCriterion } from './visibility/OdehCriterion.js';
export { YallopCriterion } from './visibility/YallopCriterion.js';
export { HMNAOCriterion } from './visibility/HMNAOCriterion.js';
export { checkVisibility, checkMultipleCriteria } from './visibility/VisibilityEngine.js';

export { getSunset } from './utils/sunset.js';
