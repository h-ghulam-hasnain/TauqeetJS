/**
 * Custom error thrown when invalid configuration options are provided to the Hijri engine
 * (e.g., missing location data for visibility-based methods).
 */
export class HijriConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HijriConfigurationError';
  }
}
