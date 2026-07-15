/**
 * Configuration options for detailed calculation diagnostics.
 *
 * @remarks
 * Used in long-running phenomena algorithms, such as equinox/solstice searching,
 * to log progress or cancel execution via an AbortSignal.
 *
 * @example
 * ```typescript
 * const config: DiagnosticsConfig = {
 *   logger: (msg, level) => console.log(`[${level}] ${msg}`),
 *   signal: AbortSignal.timeout(5000)
 * };
 * ```
 */
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
