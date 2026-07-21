import type { PrayerConfig, PrayerTimesResult, Result } from './types/index.js';
import { Success, Failure } from './types/index.js';
import { validatePrayerConfig } from './validators/validatePrayerConfig.js';
import { calculatePrayerTimesInternal, PrayerCalculationError } from './engine/PrayerEngine.js';
import { ConfigurationError, PrayerError } from './errors.js';

export { resolveTimeZoneSync } from './engine/PrayerEngine.js';
export { Madhab } from './config/madhabs.js';
export { BUILT_IN_METHODS } from './config/methodRegistry.js';
export * from './formatter/index.js';

export * from './types/index.js';
export * from './types/calendar.js';
export * from './errors.js';
export { CalendarService } from './calendars/calendarService.js';

// ── New unified single-day API ────────────────────────────────────────────────
export { getUnifiedPrayerTimes } from './unifiedEngine.js';

/**
 * Calculates prayer times synchronously using the provided configuration.
 *
 * @param config - The complete configuration object for prayer times.
 * @returns The calculated prayer times as a structured object.
 * @throws {PrayerCalculationError} If the provided configuration is invalid.
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
    throw new ConfigurationError(validation.error, { details: { source: 'validatePrayerConfig' } });
  }
  return calculatePrayerTimesInternal(validation.config);
}

/**
 * Calculates prayer times asynchronously, allowing for dynamic timezone resolution.
 *
 * @remarks
 * Supports the `resolveTimezoneAsync` hook for coordinate-to-timezone conversion
 * via an external API call.
 *
 * @param config - The configuration object for prayer times.
 * @returns A promise resolving to the calculated prayer times.
 * @throws {PrayerCalculationError} If configuration is invalid or timezone resolution fails.
 */
export async function calculatePrayerTimesAsync(config: PrayerConfig): Promise<PrayerTimesResult> {
  const validation = validatePrayerConfig(config);
  if (!validation.success) {
    throw new ConfigurationError(validation.error, { details: { source: 'validatePrayerConfig' } });
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
        timeZone: resolvedTz,
      });
    } catch (err: unknown) {
      throw new PrayerCalculationError(
        `Timezone resolution failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  return calculatePrayerTimesInternal(validatedConfig);
}

function toFailureResult(err: unknown): Result<never> {
  if (err instanceof PrayerError) {
    return Failure(err.message, {
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
      ...(err.cause !== undefined ? { cause: err.cause } : {}),
    });
  }

  if (err instanceof Error) {
    return Failure(err.message, { code: 'PRAYER_ERROR' });
  }

  return Failure(String(err), { code: 'UNKNOWN_ERROR' });
}

/**
 * Synchronous, never-throw API that wraps the result in a `Result` discriminated union.
 *
 * @param config - The configuration object for prayer times.
 * @returns A `Result` object — either `{ success: true, data }` or `{ success: false, error }`.
 */
export function getPrayerTimes(config: PrayerConfig): Result<PrayerTimesResult> {
  try {
    const data = calculatePrayerTimes(config);
    return Success(data);
  } catch (err: unknown) {
    return toFailureResult(err);
  }
}

/**
 * Asynchronous, never-throw API that wraps the result in a `Result` discriminated union.
 *
 * @param config - The configuration object for prayer times.
 * @returns A promise resolving to a `Result` with the calculation output or error message.
 */
export async function getPrayerTimesAsync(
  config: PrayerConfig
): Promise<Result<PrayerTimesResult>> {
  try {
    const data = await calculatePrayerTimesAsync(config);
    return Success(data);
  } catch (err: unknown) {
    return toFailureResult(err);
  }
}
