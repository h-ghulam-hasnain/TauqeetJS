import { describe, it, expect } from 'vitest';
import { ChebyshevInterpolator } from '../../src/internal/interpolation.js';

describe('ChebyshevInterpolator', () => {
  it('should interpolate sin(x) over [0, Math.PI] with high precision', () => {
    const a = 0;
    const b = Math.PI;
    const n = 12; // 12 terms
    const f = (x: number) => Math.sin(x);

    // Sample at Chebyshev nodes of the first kind in [a, b]
    const samples: number[] = [];
    for (let k = 1; k <= n; k++) {
      const nodeNormalized = Math.cos(((2 * k - 1) / (2 * n)) * Math.PI);
      const x = ((b - a) / 2) * nodeNormalized + (a + b) / 2;
      samples.push(f(x));
    }

    const interpolator = new ChebyshevInterpolator(a, b, samples);

    // Test at intermediate points
    const testPoints = [0, 0.5, 1, 1.5, Math.PI / 2, 2, 2.5, Math.PI];
    for (const x of testPoints) {
      const exact = Math.sin(x);
      const approx = interpolator.evaluate(x);
      const diff = Math.abs(exact - approx);
      console.log(`x: ${x.toFixed(4)} | Exact: ${exact.toFixed(8)} | Approx: ${approx.toFixed(8)} | Diff: ${diff.toExponential(4)}`);
      expect(diff).toBeLessThan(1e-7);
    }
  });
});
