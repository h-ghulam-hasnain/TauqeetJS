import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('prayer import isolation', () => {
  it('does not import the astronomy barrel from the prayer runtime path', () => {
    const iterativeSolverSource = readFileSync(
      new URL('../../src/prayers/solvers/IterativeSolver.ts', import.meta.url),
      'utf8'
    );
    const ephemerisServiceSource = readFileSync(
      new URL('../../src/internal/EphemerisService.ts', import.meta.url),
      'utf8'
    );

    expect(iterativeSolverSource).not.toContain("from '../../astronomy/index.js'");
    expect(ephemerisServiceSource).not.toContain("from '../astronomy/index.js'");
  });
});
