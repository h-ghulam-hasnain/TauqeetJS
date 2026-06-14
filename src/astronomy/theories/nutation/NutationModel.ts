import type { NutationResult } from '../../types/ephemeris.js';

export interface NutationModel {
  computeNutation(j: number, ut: number, deltaT: number): NutationResult;
}
