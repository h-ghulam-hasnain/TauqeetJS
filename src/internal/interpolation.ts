export function linearInterpolation(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x: number
): number {
  if (x1 === x0) {
    return y0;
  }
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

/**
 * Chebyshev polynomial interpolator using Clenshaw's recurrence for evaluation.
 *
 * Optimizations applied:
 *
 * 1. `Float64Array` for coefficients — enforces a contiguous, unboxed memory
 *    layout in V8, maximising CPU L1/L2 cache locality and enabling SIMD
 *    auto-vectorisation by the JIT.
 *
 * 2. Pre-computed DCT cosine matrix — the O(N²) Math.cos work is performed
 *    once in the constructor and stored in a single flat `Float64Array` buffer
 *    (row-major, index = j*n + (k-1)).  Subsequent `evaluate()` calls are
 *    purely O(N) with no transcendental function calls.
 *
 * 3. Inline Kahan compensated summation in the coefficient loop — eliminates
 *    floating-point accumulation drift during the DCT without any temporary
 *    array allocation.
 *
 * 4. Clenshaw's recurrence in `evaluate()` — already optimal O(N); preserved
 *    verbatim but now reads from the typed buffer.
 *
 * Time complexity : O(N²) construction, O(N) evaluation.
 * Space complexity: O(N²) for the cosine matrix, O(N) for coefficients.
 */
export class ChebyshevInterpolator {
  /** Chebyshev expansion coefficients c₀…c_{n-1}. */
  private readonly coefficients: Float64Array;

  /**
   * Pre-computed DCT-II cosine matrix stored row-major in a single buffer.
   * cosMatrix[j * n + (k-1)] = cos(j * (2k-1) * π / (2n))
   */
  private readonly cosMatrix: Float64Array;

  private readonly n: number;

  constructor(
    private readonly a: number,
    private readonly b: number,
    samples: readonly number[]
  ) {
    const n = samples.length;
    this.n = n;

    // ── Pre-compute the full N×N DCT cosine matrix (done once) ─────────────
    const cosMatrix = new Float64Array(n * n);
    const piOver2n  = Math.PI / (2 * n);
    for (let j = 0; j < n; j++) {
      const rowBase = j * n;
      for (let k = 1; k <= n; k++) {
        cosMatrix[rowBase + (k - 1)] = Math.cos(j * (2 * k - 1) * piOver2n);
      }
    }
    this.cosMatrix = cosMatrix;

    // ── Compute Chebyshev coefficients via DCT-II using Kahan summation ─────
    const scale        = 2 / n;
    const coefficients = new Float64Array(n);
    for (let j = 0; j < n; j++) {
      // Inline Kahan compensated sum — O(1) space, no temporary array.
      let sum = 0;
      let c   = 0;
      const rowBase = j * n;
      for (let k = 0; k < n; k++) {
        const val = samples[k]! * cosMatrix[rowBase + k]!;
        const y   = val - c;
        const t   = sum + y;
        c   = t - sum - y;
        sum = t;
      }
      const coeff      = scale * sum;
      coefficients[j]  = j === 0 ? coeff / 2 : coeff;
    }
    this.coefficients = coefficients;
  }

  /**
   * Evaluates the interpolated value at point `u ∈ [a, b]`.
   *
   * Uses Clenshaw's recurrence — numerically stable, O(N), no allocations.
   */
  public evaluate(u: number): number {
    // Map u from [a, b] → x in [-1, 1]
    const x  = (2 * u - (this.a + this.b)) / (this.b - this.a);
    const x2 = 2 * x;

    // Clenshaw's recurrence (backward accumulation)
    let d1 = 0;
    let d2 = 0;
    const coefficients = this.coefficients;
    for (let k = this.n - 1; k >= 1; k--) {
      const temp = d1;
      d1 = x2 * d1 - d2 + coefficients[k]!;
      d2 = temp;
    }
    return x * d1 - d2 + coefficients[0]!;
  }
}
