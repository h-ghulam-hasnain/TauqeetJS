import { cosd, sind } from '../../../internal/trig.js';
import { timeArguments } from '../../time/JulianDate.js';
import { normalizeDegrees } from '../../../internal/angles.js';
import { kahanSum } from '../../../internal/polynomial.js';
import type { NutationResult } from '../../types/ephemeris.js';

const cfD = [
  0, -2, 0, 0, 0, 0, -2, 0, 0, -2, -2, -2, 0, 2, 0, 2, 0, 0, -2, 0, 2, 0, 0, -2, 0, -2, 0, 0, 2, -2,
  0, -2, 0, 0, 2, 2, 0, -2, 0, 2, 2, -2, -2, 2, 2, 0, -2, -2, 0, -2, -2, 0, -1, -2, 1, 0, 0, -1, 0,
  0, 2, 0, 2,
];
const cfM = [
  0, 0, 0, 0, 1, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 1, 0,
  -1, 0, 0, 0, 1, 1, -1, 0, 0, 0, 0, 0, 0, -1, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, -1, 1, -1, -1, 0,
  -1,
];
const cfMprime = [
  0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, -1, 0, 1, -1, -1, 1, 2, -2, 0, 2, 2, 1, 0, 0, -1, 0, -1, 0, 0,
  1, 0, 2, -1, 1, 0, 1, 0, 0, 1, 2, 1, -2, 0, 1, 0, 0, 2, 2, 0, 1, 1, 0, 0, 1, -2, 1, 1, 1, -1, 3,
  0,
];
const cfF = [
  0, 2, 2, 0, 0, 0, 2, 2, 2, 2, 0, 2, 2, 0, 0, 2, 0, 2, 0, 2, 2, 2, 0, 2, 2, 2, 2, 0, 0, 2, 0, 0, 0,
  -2, 2, 2, 2, 0, 2, 2, 0, 2, 2, 0, 0, 0, 2, 0, 2, 0, 2, -2, 0, 0, 0, 2, 2, 0, 0, 2, 2, 2, 2,
];
const cfOmega = [
  1, 2, 2, 2, 0, 0, 2, 1, 2, 2, 0, 1, 2, 0, 1, 2, 1, 1, 0, 1, 2, 2, 0, 2, 0, 0, 1, 0, 1, 2, 1, 1, 1,
  0, 1, 2, 2, 0, 2, 1, 0, 2, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2, 0, 0, 2, 2, 2, 2,
];

const cfDpsi = [
  -171996, -13187, -2274, 2062, 1426, 712, -517, -386, -301, 217, -158, 129, 123, 63, 63, -59, -58,
  -51, 48, 46, -38, -31, 29, 29, 26, -22, 21, 17, 16, -16, -15, -13, -12, 11, -10, -8, 7, -7, -7,
  -7, 6, 6, 6, -6, -6, 5, -5, -5, -5, 4, 4, 4, -4, -4, -4, 3, -3, -3, -3, -3, -3, -3, -3,
];
const t1 = [
  -174.2, -1.6, -0.2, 0.2, -3.4, 0.1, 1.2, -0.4, 0, -0.5, 0, 0.1, 0, 0, 0.1, 0, -0.1, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, -0.1, 0, 0.1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
const cfDeps = [
  92025, 5736, 977, -895, 54, -7, 224, 200, 129, -95, 0, -70, -53, 0, -33, 26, 32, 27, 0, -24, 16,
  13, 0, -12, 0, 0, -10, 0, -8, 7, 9, 7, 6, 0, 5, 3, -3, 0, 3, 3, 0, -3, -3, 3, 3, 0, 3, 3, 3, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];
const t2 = [
  8.9, -3.1, -0.5, 0.5, -0.1, 0, -0.6, 0, -0.1, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0,
];

export function computeNutation(j: number, ut: number, deltaT: number): NutationResult {
  const { te } = timeArguments(j, ut, deltaT);

  let D = 297.85036 + te * (445267.11148 + te * (te / 189474 - 0.0019142));
  D = normalizeDegrees(D);

  let M = 357.52772 + te * (35999.05034 - te * (0.0001603 + te / 300000));
  M = normalizeDegrees(M);

  let Mprime = 134.96298 + te * (477198.867398 + te * (0.0086972 + te / 56250));
  Mprime = normalizeDegrees(Mprime);

  let F = 93.27191 + te * (483202.017538 + te * (te / 327270 - 0.0036825));
  F = normalizeDegrees(F);

  let Omega = 125.04452 - te * (1934.136261 + te * (0.0020708 + te / 450000));
  Omega = normalizeDegrees(Omega);

  const sinTerms = cfD.map((d, i) =>
    sind(d * D + cfM[i]! * M + cfMprime[i]! * Mprime + cfF[i]! * F + cfOmega[i]! * Omega)
  );
  const cosTerms = cfD.map((d, i) =>
    cosd(d * D + cfM[i]! * M + cfMprime[i]! * Mprime + cfF[i]! * F + cfOmega[i]! * Omega)
  );

  const dpsiTerms = sinTerms.map((term, i) => term * (cfDpsi[i]! + te * t1[i]!));
  const depsTerms = cosTerms.map((term, i) => term * (cfDeps[i]! + te * t2[i]!));

  const deltaPsi = kahanSum(dpsiTerms) / 36000000;
  const deltaEps = kahanSum(depsTerms) / 36000000;
  const eps0 = 23.4392911111111 + (te * (te * (te * 0.001813 - 0.00059) - 46.815)) / 3600;
  const eps = eps0 + deltaEps;

  return { deltaPsi, deltaEps, eps0, eps };
}
