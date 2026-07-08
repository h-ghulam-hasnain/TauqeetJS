export interface DiagnosticsConfig {
  /**
   * Optional logger callback to trace execution and diagnostics.
   */
  readonly logger?: (message: string, level: 'debug' | 'info' | 'warn' | 'error') => void;

  /**
   * Optional AbortSignal to safely cancel long-running iterative calculations.
   */
  readonly signal?: AbortSignal;
}
