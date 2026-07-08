export class HijriConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HijriConfigurationError';
  }
}
