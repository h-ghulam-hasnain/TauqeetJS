import { CalculationMethod, MethodParams } from '../types/index.js';

export const PRESETS: Record<CalculationMethod, MethodParams> = {
  MWL: { fajrAngle: 18, ishaAngle: 17 },
  ISNA: { fajrAngle: 15, ishaAngle: 15 },
  Egypt: { fajrAngle: 19.5, ishaAngle: 17.5 },
  Makkah: { fajrAngle: 18.5, ishaInterval: 90 },
  Karachi: { fajrAngle: 18, ishaAngle: 18 },
  Tehran: { fajrAngle: 17.7, ishaAngle: 14, maghribAngle: 4.5 },
  Jafari: { fajrAngle: 16, ishaAngle: 14, maghribAngle: 4 },
};
