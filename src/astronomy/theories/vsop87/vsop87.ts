import { kahanSum } from '../../../internal/polynomial.js';
import {
  L0_A,
  L0_B,
  L0_C,
  L1_A,
  L1_B,
  L1_C,
  L2_A,
  L2_B,
  L2_C,
  L3_A,
  L3_B,
  L3_C,
  L4_A,
  L4_B,
  L4_C,
  L5_A,
  L5_B,
  L5_C,
  B0_A,
  B0_B,
  B0_C,
  B1_A,
  B1_B,
  B1_C,
  R0_A,
  R0_B,
  R0_C,
  R1_A,
  R1_B,
  R1_C,
  R2_A,
  R2_B,
  R2_C,
  R3_A,
  R3_B,
  R3_C,
} from './vsop87Coefficients.js';

export interface EarthHeliocentricState {
  readonly longitude: number;
  readonly latitude: number;
  readonly radius: number;
}

function seriesSum(
  a: readonly number[],
  b: readonly number[],
  c: readonly number[],
  tau: number
): number {
  const len = Math.min(a.length, b.length, c.length);
  const values: number[] = [];
  for (let i = 0; i < len; i += 1) {
    const ai = a[i]!;
    const bi = b[i]!;
    const ci = c[i]!;
    values.push(ai * Math.cos(bi + tau * ci));
  }
  return kahanSum(values);
}

export function computeEarthHeliocentricState(tau: number): EarthHeliocentricState {
  const sumL0 = seriesSum(L0_A, L0_B, L0_C, tau);
  const sumL1 = seriesSum(L1_A, L1_B, L1_C, tau);
  const sumL2 = seriesSum(L2_A, L2_B, L2_C, tau);
  const sumL3 = seriesSum(L3_A, L3_B, L3_C, tau);
  const sumL4 = seriesSum(L4_A, L4_B, L4_C, tau);
  const sumL5 = seriesSum(L5_A, L5_B, L5_C, tau);
  const longitude =
    (sumL0 + tau * (sumL1 + tau * (sumL2 + tau * (sumL3 + tau * (sumL4 + tau * sumL5))))) /
    100000000;

  const sumB0 = seriesSum(B0_A, B0_B, B0_C, tau);
  const sumB1 = seriesSum(B1_A, B1_B, B1_C, tau);
  const latitude = (sumB0 + sumB1 * tau) / 100000000;

  const sumR0 = seriesSum(R0_A, R0_B, R0_C, tau);
  const sumR1 = seriesSum(R1_A, R1_B, R1_C, tau);
  const sumR2 = seriesSum(R2_A, R2_B, R2_C, tau);
  const sumR3 = seriesSum(R3_A, R3_B, R3_C, tau);
  const radius = (sumR0 + tau * (sumR1 + tau * (sumR2 + tau * sumR3))) / 100000000;

  return {
    longitude,
    latitude,
    radius,
  };
}
