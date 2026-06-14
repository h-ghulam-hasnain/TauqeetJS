export interface VisibilityInput {
  sunset: Date;
  moonset?: Date;
  moonAltitudeAtSunset: number;   // degrees
  moonAzimuthAtSunset: number;
  elongation: number;             // degrees
  moonAgeHours: number;
  arcv?: number;                  // altitude difference
  arcl?: number;                  // elongation difference (sometimes used)
}

export interface VisibilityResult {
  criterionName: string;
  visible: boolean;
  confidence?: number;            // 0..1
  category?: string;              // e.g., 'A', 'B', 'C' for Yallop
  details?: Record<string, any>;
}

export enum VisibilityMethod {
  ODEH = 'odeh',
  YALLOP = 'yallop',
  HMNAO = 'hmnao'
}
