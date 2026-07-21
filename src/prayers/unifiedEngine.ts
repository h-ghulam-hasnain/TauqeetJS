import type {
  PrayerConfig,
  UnifiedPrayerTimesResult,
  DayType,
  CalculationStrategy,
} from './types/index.js';
import { validatePrayerConfig } from './validators/validatePrayerConfig.js';
import { calculatePrayerTimesInternal } from './engine/PrayerEngine.js';
import { classifyLatitude, LatitudeCase } from './engine/LatitudeClassifier.js';
import { calculateDhuhr } from './calculations/Dhuhr.js';
import { ConfigurationError, PrayerCalculationError } from './errors.js';

/** Zero-pad to 2 digits. */
const p2 = (n: number) => String(n).padStart(2, '0');

/** Format a UTC Date as "YYYY-MM-DD". */
function toDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`;
}

/**
 * Converts the `highLatitudeStrategy` string to the CalculationStrategy enum value.
 */
function toCalcStrategy(
  strategy: string | undefined,
): CalculationStrategy {
  switch (strategy) {
    case 'AngleBased':        return 'ANGLE_BASED';
    case 'SeventhOfNight':    return 'SEVENTH_OF_NIGHT';
    case 'NearestLatitude':   return 'NEAREST_LATITUDE_FALLBACK';
    case 'MiddleOfNight':
    default:                  return 'MIDDLE_OF_NIGHT';
  }
}

/**
 * Unified, synchronous, never-throw single-day prayer calculation function.
 *
 * @remarks
 * This is the canonical public entry-point for single-day calculations.
 * It encapsulates all astronomical boundary conditions internally:
 *
 * - **NORMAL**: Standard twilight geometry converges successfully.
 * - **HIGH_LATITUDE**: Twilight angle is never reached; the user-specified
 *   `highLatitudeStrategy` is applied automatically (default: `MiddleOfNight`).
 * - **POLAR_DAY / POLAR_NIGHT**: Sun never sets or rises; nearest-latitude
 *   fallback is applied automatically at `regionalFallbackLatitude` (default 45°).
 *
 * The function only throws if the supplied `PrayerConfig` fails basic geographic
 * validation (e.g. `lat` outside `(-90, +90)`). For all valid coordinates it is
 * guaranteed to return a complete, populated `UnifiedPrayerTimesResult`.
 *
 * @param config - User-supplied prayer configuration.
 * @returns A structured result containing ISO-8601 prayer time strings and rich metadata.
 *
 * @example
 * ```typescript
 * const result = getUnifiedPrayerTimes({
 *   lat: 69.6492,
 *   long: 18.9553,
 *   date: '2024-06-21',
 *   method: 'MWL',
 *   madhab: 'Hanafi',
 * });
 * // result.metadata.dayType      → 'POLAR_DAY'
 * // result.metadata.appliedStrategy → 'NEAREST_LATITUDE_FALLBACK'
 * // result.metadata.evaluatedLatitude → 45
 * ```
 */
export function getUnifiedPrayerTimes(config: PrayerConfig): UnifiedPrayerTimesResult {
  // ── Step A: Validate & compile config ────────────────────────────────────────
  const validation = validatePrayerConfig(config);
  if (!validation.success) {
    throw new ConfigurationError(validation.error, { details: { source: 'validatePrayerConfig' } });
  }
  const vConf = validation.config;

  // ── Step B: Polar Gate — classify astronomical boundary ─────────────────────
  const dhuhrTransit = calculateDhuhr(vConf.date, vConf.latitude, vConf.longitude);
  if (!dhuhrTransit) {
    throw new PrayerCalculationError('Solar transit calculation failed for the given date and coordinates.', {
      details: { source: 'calculateDhuhr' },
    });
  }

  const latCase = classifyLatitude(
    vConf.latitude,
    dhuhrTransit.declination,
    vConf.method.fajrAngle,
  );

  let dayType: DayType = 'NORMAL';
  let appliedStrategy: CalculationStrategy = 'NONE';
  let evaluatedLatitude = vConf.latitude;
  const fallbackLat = vConf.regionalFallbackLatitude ?? 45;
  const sign = vConf.latitude < 0 ? -1 : 1;

  // ── Step C: Resolve day classification and evaluated latitude ────────────────
  if (latCase === LatitudeCase.POLAR_DAY || latCase === LatitudeCase.POLAR_NIGHT) {
    // Polar conditions: bypass standard geometry, project to safe anchor latitude
    dayType = latCase === LatitudeCase.POLAR_DAY ? 'POLAR_DAY' : 'POLAR_NIGHT';
    appliedStrategy = 'NEAREST_LATITUDE_FALLBACK';
    evaluatedLatitude = sign * fallbackLat;
  } else if (latCase === LatitudeCase.REGIONAL_FALLBACK) {
    // Near-pole singularity: also use nearest latitude fallback
    dayType = 'HIGH_LATITUDE';
    appliedStrategy = 'NEAREST_LATITUDE_FALLBACK';
    evaluatedLatitude = sign * fallbackLat;
  } else if (latCase === LatitudeCase.CONTINUOUS_TWILIGHT) {
    // High-latitude twilight: apply the user's chosen strategy
    dayType = 'HIGH_LATITUDE';
    appliedStrategy = toCalcStrategy(vConf.highLatitudeStrategy);
    if (appliedStrategy === 'NEAREST_LATITUDE_FALLBACK') {
      evaluatedLatitude = sign * fallbackLat;
    }
  }
  // else: NORMAL — evaluatedLatitude stays as vConf.latitude, strategy stays 'NONE'

  // ── Step D: Execute core astronomical pipeline on evaluated latitude ─────────
  // Rebuild only the latitude field; all other invariants are pointer-stable.
  const engineConfig = evaluatedLatitude !== vConf.latitude
    ? { ...vConf, latitude: evaluatedLatitude }
    : vConf;

  const raw = calculatePrayerTimesInternal(engineConfig);

  // ── Step E: Map TimeField results → serializable ISO strings ────────────────
  // Fallback to dhuhr (solar transit) ISO string for any polar/twilight null fields
  const fallbackIso = raw.dhuhr.utc ?? vConf.date.toISOString();

  return {
    date: toDateString(vConf.date),
    times: {
      fajr:    raw.fajr.utc    ?? fallbackIso,
      sunrise: raw.sunrise.utc ?? fallbackIso,
      dhuhr:   raw.dhuhr.utc   ?? fallbackIso,
      asr:     raw.asr.utc     ?? fallbackIso,
      maghrib: raw.maghrib.utc ?? fallbackIso,
      isha:    raw.isha.utc    ?? fallbackIso,
    },
    metadata: {
      dayType,
      appliedStrategy,
      evaluatedLatitude,
    },
  };
}
