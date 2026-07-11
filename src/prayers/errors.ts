/**
 * Custom error thrown when the provided prayer configuration is invalid or missing required fields.
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
