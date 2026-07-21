export interface PrayerErrorOptions {
  readonly cause?: unknown;
  readonly details?: Record<string, unknown>;
  readonly code?: string;
}

/**
 * Base class for prayer-specific errors with structured metadata.
 */
export class PrayerError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown> | undefined;
  override readonly cause?: unknown;

  constructor(message: string, options: PrayerErrorOptions = {}) {
    super(message);
    this.name = 'PrayerError';
    this.code = options.code ?? 'PRAYER_ERROR';
    if (options.details !== undefined) {
      this.details = options.details;
    }
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

/**
 * Custom error thrown when the provided prayer configuration is invalid or missing required fields.
 */
export class ConfigurationError extends PrayerError {
  constructor(message: string, options: PrayerErrorOptions = {}) {
    super(message, { ...options, code: options.code ?? 'CONFIGURATION_ERROR' });
    this.name = 'ConfigurationError';
  }
}

/**
 * Custom error thrown when a prayer calculation fails due to invalid inputs or runtime calculation issues.
 */
export class PrayerCalculationError extends PrayerError {
  constructor(message: string, options: PrayerErrorOptions = {}) {
    super(message, { ...options, code: options.code ?? 'PRAYER_CALCULATION_ERROR' });
    this.name = 'PrayerCalculationError';
  }
}
