export interface MoonPhaseResult {
  elongation: number;            // degrees (0..360)
  illuminatedFraction: number;   // 0..1
  phaseAngle?: number;           // degrees
  phaseName?: string;            // optional, e.g., "New", "Waxing Crescent", etc.
}
