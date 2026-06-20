export interface MoonPhaseResult {
  /** Normalized phase fraction 0..1 (0 = New, 0.5 = Full). Optional legacy field. */
  phase?: number;
  elongation: number; // degrees (0..360)
  illuminatedFraction: number; // 0..1
  phaseAngle?: number; // degrees
  phaseName?: string; // e.g., "New", "Waxing Crescent", etc.
}
