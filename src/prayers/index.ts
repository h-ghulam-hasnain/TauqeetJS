import type { PrayerConfig, PrayerTimesResult, Result } from './types/index.js';
import { Success, Failure } from './types/index.js';
import { validatePrayerConfig } from './validators/validatePrayerConfig.js';
import { calculatePrayerTimesInternal, PrayerCalculationError } from './engine/PrayerEngine.js';

export { resolveTimeZoneSync } from './engine/PrayerEngine.js';
export { Madhab } from './config/madhabs.js';
export { BUILT_IN_METHODS } from './config/methodRegistry.js';
export * from './formatter/index.js';

export * from './types/index.js';
export * from './types/calendar.js';
export { CalendarService } from './calendars/calendarService.js';
/**
 * Calculates prayer times synchronously using the provided configuration.
 *
 * @param config - The complete configuration object for prayer times, including coordinates and calculation methods.
 * @returns The calculated prayer times as a structured object containing all daily prayer events.
 * @throws {PrayerCalculationError} If the provided configuration is invalid or calculation fails.
 *
 * @example
 * ```typescript
 * const times = calculatePrayerTimes({
 *   lat: 40.7128,
 *   long: -74.0060,
 *   date: new Date(),
 *   method: 'ISNA'
 * });
 * console.log(times.fajr.local);
 * ```
 */
export function calculatePrayerTimes(config: PrayerConfig): PrayerTimesResult {
  const validation = validatePrayerConfig(config);
  if (!validation.success) {
    throw new PrayerCalculationError(validation.error);
  }
  return calculatePrayerTimesInternal(validation.config);
}

/**
 * Calculates prayer times asynchronously, allowing for dynamic timezone resolution.
 *
 * @remarks
 * This function supports the `resolveTimezoneAsync` hook in the configuration, which is useful
 * when coordinates must be converted to a timezone identifier via an external API.
 *
 * @param config - The configuration object for prayer times.
 * @returns A promise resolving to the calculated prayer times.
 * @throws {PrayerCalculationError} If the configuration is invalid or timezone resolution fails.
 */
import { getVSOP87Tables } from '../astronomy/loader.js';

export async function calculatePrayerTimesAsync(config: PrayerConfig): Promise<PrayerTimesResult> {
  const validation = validatePrayerConfig(config);
  if (!validation.success) {
    throw new PrayerCalculationError(validation.error);
  }
  await getVSOP87Tables();

  const validatedConfig = validation.config;
  if (validatedConfig.resolveTimezoneAsync) {
    try {
      const resolvedTz = await validatedConfig.resolveTimezoneAsync(
        validatedConfig.latitude,
        validatedConfig.longitude
      );
      return calculatePrayerTimesInternal({
        ...validatedConfig,
        timeZone: resolvedTz,
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
 * Legacy-compatible synchronous API that returns a wrapped Result object instead of throwing.
 *
 * @param config - The configuration object for prayer times.
 * @returns A `Result` object containing either the successful data or an error message.
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
 * Legacy-compatible asynchronous API that returns a wrapped Result object instead of throwing.
 *
 * @param config - The configuration object for prayer times.
 * @returns A promise resolving to a `Result` object with the calculation output or error.
 */
export async function getPrayerTimesAsync(
  config: PrayerConfig
): Promise<Result<PrayerTimesResult>> {
  try {
    const data = await calculatePrayerTimesAsync(config);
    return Success(data);
  } catch (err: unknown) {
    return Failure(toMessage(err));
  }
}
