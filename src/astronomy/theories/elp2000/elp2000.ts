import { acosd, asind, atand2, cosd, sind, tand } from '../../../internal/trig.js';
import { normalizeDegrees } from '../../../internal/angles.js';
import { timeArguments } from '../../time/JulianDate.js';
import { computeNutation } from '../nutation/iau1980.js';
import { computeSolarPosition } from '../../bodies/sun/SolarPosition.js';
import {
  COEFF_SUM_L_D,
  COEFF_SUM_L_M,
  COEFF_SUM_L_MPRIME,
  COEFF_SUM_L_F,
  COEFF_SUM_L_SINE,
  COEFF_SUM_L_COSINE,
  COEFF_SUM_B_D,
  COEFF_SUM_B_M,
  COEFF_SUM_B_MPRIME,
  COEFF_SUM_B_F,
  COEFF_SUM_B_SINE,
} from './elp2000Coefficients.js';
import type { LunarPositionResult } from '../../types/ephemeris.js';

function applyEccentricity(value: number, mfactor: number, e: number): number {
  if (mfactor === 1 || mfactor === -1) {
    return value * e;
  }
  if (mfactor === 2 || mfactor === -2) {
    return value * e * e;
  }
  return value;
}

export function computeLunarPosition(j: number, ut: number, deltaT: number): LunarPositionResult {
  const { jd, t, te } = timeArguments(j, ut, deltaT);

  const Ldash =
    218.316447 + te * (te * (te * (1.85584e-6 - te / 65194000) - 0.0015786) + 481267.88123421);
  const D =
    297.8501921 + te * (te * (te * (1.83194e-6 - te / 113065000) - 0.0018819) + 445267.1114034);
  const M = 357.5291092 + te * (te * (te / 24490000 - 0.0001536) + 35999.0502909);
  const Mdash =
    134.9633964 + te * (te * (te * (1.434741e-5 - te / 14712000) + 0.0087414) + 477198.8675055);
  const F =
    93.272095 + te * (te * (te * (te / 8633100000 - 2.8361e-7) - 0.0036539) + 483202.0175233);

  const A_1 = normalizeDegrees(119.75 + 131.849 * te);
  const A_2 = normalizeDegrees(53.09 + 479264.29 * te);
  const A_3 = normalizeDegrees(313.45 + 481266.484 * te);
  const E = 1 - te * (te * 0.0000074 + 0.002516);

  function sumSeries(
    coeffs: readonly number[],
    dCoefs: readonly number[],
    mCoefs: readonly number[],
    mPrimeCoefs: readonly number[],
    fCoefs: readonly number[],
    callback: (coefficient: number, arg: number, mfactor: number) => number
  ): number {
    const len = Math.min(
      coeffs.length,
      dCoefs.length,
      mCoefs.length,
      mPrimeCoefs.length,
      fCoefs.length
    );
    let sum = 0;
    for (let i = 0; i < len; i += 1) {
      const di = dCoefs[i]!;
      const mi = mCoefs[i]!;
      const mpi = mPrimeCoefs[i]!;
      const fi = fCoefs[i]!;
      const coefficient = coeffs[i]!;
      const arg = di * D + mi * M + mpi * Mdash + fi * F;
      sum += callback(coefficient, arg, mi);
    }
    return sum;
  }

  const sumL = sumSeries(
    COEFF_SUM_L_SINE,
    COEFF_SUM_L_D,
    COEFF_SUM_L_M,
    COEFF_SUM_L_MPRIME,
    COEFF_SUM_L_F,
    (coefficient, arg, mfactor) => applyEccentricity(coefficient * sind(arg), mfactor, E)
  );

  const lambdaMoon = normalizeDegrees(
    Ldash + (sumL + 3958 * sind(A_1) + 1962 * sind(Ldash - F) + 318 * sind(A_2)) / 1000000
  );
  const { deltaPsi, eps } = computeNutation(j, ut, deltaT);
  const lambdaMoonApparent = lambdaMoon + deltaPsi;

  const sumR = sumSeries(
    COEFF_SUM_L_COSINE,
    COEFF_SUM_L_D,
    COEFF_SUM_L_M,
    COEFF_SUM_L_MPRIME,
    COEFF_SUM_L_F,
    (coefficient, arg, mfactor) => applyEccentricity(coefficient * cosd(arg), mfactor, E)
  );

  const deltaMoon = 385000.56 + sumR / 1000;

  const lenB = Math.min(
    COEFF_SUM_B_SINE.length,
    COEFF_SUM_B_D.length,
    COEFF_SUM_B_M.length,
    COEFF_SUM_B_MPRIME.length,
    COEFF_SUM_B_F.length
  );
  let sumB = 0;
  for (let i = 0; i < lenB; i += 1) {
    const dBi = COEFF_SUM_B_D[i]!;
    const mBi = COEFF_SUM_B_M[i]!;
    const mpBi = COEFF_SUM_B_MPRIME[i]!;
    const fBi = COEFF_SUM_B_F[i]!;
    const sineCoef = COEFF_SUM_B_SINE[i]!;
    const arg = dBi * D + mBi * M + mpBi * Mdash + fBi * F;
    sumB += sineCoef * sind(arg);
  }

  const betaMoon =
    (sumB -
      2235 * sind(Ldash) +
      382 * sind(A_3) +
      175 * sind(A_1 - F) +
      175 * sind(A_1 + F) +
      127 * sind(Ldash - Mdash) -
      115 * sind(Ldash + Mdash)) /
    1000000;

  const RA = normalizeDegrees(
    atand2(
      sind(lambdaMoonApparent) * cosd(eps) - tand(betaMoon) * sind(eps),
      cosd(lambdaMoonApparent)
    )
  );
  const Dec = asind(
    sind(betaMoon) * cosd(eps) + cosd(betaMoon) * sind(eps) * sind(lambdaMoonApparent)
  );
  const GMST = normalizeDegrees(
    280.46061837 + 360.98564736629 * (jd - 2451545) + t * t * (0.000387933 - t / 38710000)
  );
  const GAST = normalizeDegrees(GMST + deltaPsi * cosd(eps));
  const GHAMoon = normalizeDegrees(GAST - RA);

  const HPMoon = asind(6378.14 / deltaMoon);
  const SDMoon = asind(1738 / deltaMoon);

  const sun = computeSolarPosition(j, ut, deltaT);
  const psi = acosd(
    sind(sun.declination) * sind(Dec) +
      cosd(sun.declination) * cosd(Dec) * cosd(sun.rightAscension - RA)
  );
  const deltaSun = 1.496e8 * sun.distanceAu;
  const iAngle = atand2(deltaSun * sind(psi), deltaMoon - deltaSun * cosd(psi));
  const k = (1 + Math.cos(iAngle * (Math.PI / 180))) / 2;

  return {
    rightAscension: RA,
    declination: Dec,
    gha: GHAMoon,
    sha: normalizeDegrees(360 - RA),
    horizontalParallax: HPMoon,
    semidiameter: SDMoon,
    distanceKm: deltaMoon,
    illuminationFraction: k,
    apparentLongitude: lambdaMoonApparent,
  };
}
