export type { GeographicPosition } from './types/observer.js';
export type {
  NutationResult,
  SolarPositionResult,
  LunarPositionResult,
} from './types/ephemeris.js';
export type { EventTime } from './types/phenomena.js';

export { computeSolarPosition } from './bodies/sun/SolarEphemeris.js';
export { computeLunarPosition } from './bodies/moon/LunarEphemeris.js';
export { computeLunarPhase } from './bodies/moon/LunarPhase.js';
export {
  computeNextFullMoon,
  computeNextNewMoon,
  computePreviousNewMoon,
  computePreviousFullMoon,
} from './phenomena/LunarEvents.js';
export { dateToJulianDay, julianDayToDate, timeArguments } from './time/JulianDate.js';
export { calculateDeltaT } from './time/DeltaT.js';
export { computeSeasons, searchSeasonEvent, type SeasonInfo } from './phenomena/Seasons.js';
export {
  EclipseKind,
  searchLunarEclipse,
  searchGlobalSolarEclipse,
  nextLunarEclipse,
  nextGlobalSolarEclipse,
  searchLocalSolarEclipse,
  nextLocalSolarEclipse,
  type LunarEclipseInfo,
  type GlobalSolarEclipseInfo,
  type EclipseEvent,
  type LocalSolarEclipseInfo,
} from './phenomena/Eclipse.js';

