import type { PrayerConfig, PrayerTimesResult, Result } from './types/index.js';
import { Success, Failure } from './types/index.js';
import { validatePrayerConfig } from './validators/validatePrayerConfig.js';
import { calculatePrayerTimesInternal, PrayerCalculationError } from './engine/PrayerEngine.js';

export function calculatePrayerTimes(config: PrayerConfig): PrayerTimesResult {
  const validation = validatePrayerConfig(config);
  if (!validation.success) {
    throw new PrayerCalculationError(validation.error);
  }
  return calculatePrayerTimesInternal(validation.config);
}

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
        timeZone: resolvedTz,
      });
    } catch (err: unknown) {
      throw new PrayerCalculationError(`Timezone resolution failed: ${String(err)}`);
    }
  }
  return calculatePrayerTimesInternal(validatedConfig);
}

export function getPrayerTimesLegacy(config: PrayerConfig): Result<PrayerTimesResult> {
  try {
    const data = calculatePrayerTimes(config);
    return Success(data);
  } catch (err: unknown) {
    return Failure(String(err));
  }
}

export async function getPrayerTimesAsync(
  config: PrayerConfig
): Promise<Result<PrayerTimesResult>> {
  try {
    const data = await calculatePrayerTimesAsync(config);
    return Success(data);
  } catch (err: unknown) {
    return Failure(String(err));
  }
}
