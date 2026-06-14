import type { PrayerConfig, PrayerTimesResult, Result } from './types/index.js';
import { Success, Failure } from './types/index.js';
import { validatePrayerConfig } from './validators/validatePrayerConfig.js';
import { calculatePrayerTimesInternal, PrayerCalculationError } from './engine/PrayerEngine.js';

export { resolveTimeZoneSync } from './engine/PrayerEngine.js';
export { Madhab } from './config/madhabs.js';
export { BUILT_IN_METHODS } from './config/methodRegistry.js';
export { formatPrayerTimes } from './formatter/index.js';

export * from './types/index.js';

/**
 * Synchronous API for calculating prayer times.
 * Throws a PrayerCalculationError if configuration validation fails.
 */
export function calculatePrayerTimes(config: PrayerConfig): PrayerTimesResult {
  const validation = validatePrayerConfig(config);
  if (!validation.success) {
    throw new PrayerCalculationError(validation.error);
  }
  return calculatePrayerTimesInternal(validation.config);
}

/**
 * Asynchronous API for calculating prayer times.
 * Supports async timezone resolution via resolveTimezoneAsync hook.
 * Throws a PrayerCalculationError if configuration validation fails.
 */
export async function calculatePrayerTimesAsync(config: PrayerConfig): Promise<PrayerTimesResult> {
  const validation = validatePrayerConfig(config);
  if (!validation.success) {
    throw new PrayerCalculationError(validation.error);
  }

  const validatedConfig = validation.config;
  if (validatedConfig.resolveTimezoneAsync) {
    try {
      const resolvedTz = await validatedConfig.resolveTimezoneAsync(
        validatedConfig.latitude,
        validatedConfig.longitude
      );
      return calculatePrayerTimesInternal({
        ...validatedConfig,
        timeZone: resolvedTz
      });
    } catch (err: unknown) {
      throw new PrayerCalculationError(`Timezone resolution failed: ${toMessage(err)}`);
    }
  }

  return calculatePrayerTimesInternal(validatedConfig);
}

/** Safely extracts a message string from an unknown thrown value. */
function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Legacy-compatible synchronous API. Returns a Result wrapper instead of throwing.
 */
export function getPrayerTimes(config: PrayerConfig): Result<PrayerTimesResult> {
  try {
    const data = calculatePrayerTimes(config);
    return Success(data);
  } catch (err: unknown) {
    return Failure(toMessage(err));
  }
}

/**
 * Legacy-compatible asynchronous API. Returns a Result wrapper instead of throwing.
 */
export async function getPrayerTimesAsync(config: PrayerConfig): Promise<Result<PrayerTimesResult>> {
  try {
    const data = await calculatePrayerTimesAsync(config);
    return Success(data);
  } catch (err: unknown) {
    return Failure(toMessage(err));
  }
}
