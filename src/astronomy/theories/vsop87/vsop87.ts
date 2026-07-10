import {
  L0,
  L1,
  L2,
  L3,
  L4,
  L5,
  B0,
  B1,
  B2,
  B3,
  B4,
  R0,
  R1,
  R2,
  R3,
  R4,
  R5,
  type ParallelSeries
} from './vsop87Packed.js';


export interface EarthHeliocentricState {
  readonly longitude: number;
  readonly latitude: number;
  readonly radius: number;
}

/**
 * Evaluates a single VSOP87 trigonometric series using 3 parallel Float64Arrays.
 *
 * Implements a 2-lane unrolled Kahan compensated summation to eliminate
 * loop-carried dependencies (pipeline stalls), increasing ILP.
 *
 * Complexity: O(N) time, O(1) space.
 */
export function seriesSum(tau: number, A: Float64Array, B: Float64Array, C: Float64Array): number {
  let sum1 = 0, c_comp1 = 0;
  let sum2 = 0, c_comp2 = 0;
  const len = A.length;
  let i = 0;

  for (; i <= len - 2; i += 2) {
    // Lane 1
    const val1 = A[i]! * Math.cos(B[i]! + tau * C[i]!);
    const y1 = val1 - c_comp1;
    const t1 = sum1 + y1;
    c_comp1 = t1 - sum1 - y1;
    sum1 = t1;

    // Lane 2
    const val2 = A[i + 1]! * Math.cos(B[i + 1]! + tau * C[i + 1]!);
    const y2 = val2 - c_comp2;
    const t2 = sum2 + y2;
    c_comp2 = t2 - sum2 - y2;
    sum2 = t2;
  }

  // Remainder
  for (; i < len; i++) {
    const val1 = A[i]! * Math.cos(B[i]! + tau * C[i]!);
    const y1 = val1 - c_comp1;
    const t1 = sum1 + y1;
    c_comp1 = t1 - sum1 - y1;
    sum1 = t1;
  }

  // Merge the two accumulators safely using Kahan
  const yFinal = sum2 - c_comp1;
  const tFinal = sum1 + yFinal;
  // c_comp1 = tFinal - sum1 - yFinal; // Not needed as we return
  const finalSum = tFinal - c_comp2;

  return finalSum;
}

function sumSeriesParallel(series: ParallelSeries, tau: number): number {
  return seriesSum(tau, series.A, series.B, series.C);
}

export function computeEarthHeliocentricState(tau: number): EarthHeliocentricState {
  const sumL0 = sumSeriesParallel(L0, tau);
  const sumL1 = sumSeriesParallel(L1, tau);
  const sumL2 = sumSeriesParallel(L2, tau);
  const sumL3 = sumSeriesParallel(L3, tau);
  const sumL4 = sumSeriesParallel(L4, tau);
  const sumL5 = sumSeriesParallel(L5, tau);
  const longitude = sumL0 + tau * (sumL1 + tau * (sumL2 + tau * (sumL3 + tau * (sumL4 + tau * sumL5))));

  const sumB0 = sumSeriesParallel(B0, tau);
  const sumB1 = sumSeriesParallel(B1, tau);
  const sumB2 = sumSeriesParallel(B2, tau);
  const sumB3 = sumSeriesParallel(B3, tau);
  const sumB4 = sumSeriesParallel(B4, tau);
  const latitude = sumB0 + tau * (sumB1 + tau * (sumB2 + tau * (sumB3 + tau * sumB4)));

  const sumR0 = sumSeriesParallel(R0, tau);
  const sumR1 = sumSeriesParallel(R1, tau);
  const sumR2 = sumSeriesParallel(R2, tau);
  const sumR3 = sumSeriesParallel(R3, tau);
  const sumR4 = sumSeriesParallel(R4, tau);
  const sumR5 = sumSeriesParallel(R5, tau);
  const radius = sumR0 + tau * (sumR1 + tau * (sumR2 + tau * (sumR3 + tau * (sumR4 + tau * sumR5))));

  return {
    longitude,
    latitude,
    radius,
  };
}
