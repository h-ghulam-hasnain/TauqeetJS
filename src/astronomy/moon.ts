/**
 * High-precision Lunar Ephemeris calculations.
 * Based on Meeus, Astronomical Algorithms.
 */
import { atan2d, cosd, norm360, sind, tand, asind } from '../core/math.js';

export interface MoonResult {
  RA: number;
  DEC: number;
  GHA: number;
  SHA: number;
  SD: number;
  HP: number;
  illumination: number; // Percentage
  isWaxing: boolean;
  distance: number; // Earth-Moon distance in km
}

// Optimized numerical representation of the moon terms to reduce bundle size and parsing overhead.
const MOON_TERMS = [
  [0, 0, 1, 0, 6288774, -20905355],
  [2, 0, -1, 0, 1274027, -3699111],
  [2, 0, 0, 0, 658314, -2955968],
  [0, 0, 2, 0, 213618, -569925],
  [0, 1, 0, 0, -185116, 48888],
  [0, 0, 0, 2, -114332, -3149],
  [2, 0, -2, 0, 58793, 246158],
  [2, -1, -1, 0, 57066, -152138],
  [2, 0, 1, 0, 53322, -170733],
  [2, -1, 0, 0, 45758, -204586],
  [0, 1, -1, 0, -40923, -129620],
  [1, 0, 0, 0, -34720, 108743],
  [0, 1, 1, 0, -30383, 104755],
  [2, 0, 0, -2, 15327, 10321],
  [0, 0, 1, 2, -12528, 0],
  [0, 0, 1, -2, 10980, 79661],
  [4, 0, -1, 0, 10675, -34782],
  [0, 0, 3, 0, 10034, -23210],
  [4, 0, -2, 0, 8548, -21636],
  [2, 1, -1, 0, -7888, 24208],
  [2, 1, 0, 0, -6766, 30824],
  [1, 0, -1, 0, -5163, -8379],
  [1, 1, 0, 0, 4987, -16675],
  [2, -1, 1, 0, 4036, -12831],
  [2, 0, 2, 0, 3994, -10445],
  [4, 0, 0, 0, 3861, -11650],
  [2, 0, -3, 0, 3665, 14403],
  [0, 1, -2, 0, -2689, -7003],
  [2, 0, -1, 2, -2602, 0],
  [2, -1, -2, 0, 2390, 10056],
  [1, 0, 1, 0, -2348, 6322],
  [2, -2, 0, 0, 2236, -9884],
  [0, 1, 2, 0, -2120, 5751],
  [0, 2, 0, 0, -2069, 0],
  [2, -2, -1, 0, 2048, -4950],
  [2, 0, 1, -2, -1773, 4130],
  [2, 0, 0, 2, -1595, 0],
  [4, -1, -1, 0, 1215, -3958],
  [0, 0, 2, 2, -1110, 0],
  [3, 0, -1, 0, -892, 3258],
  [2, 1, 1, 0, -810, 2616],
  [4, -1, -2, 0, 759, -1897],
  [0, 2, -1, 0, -713, -2117],
  [2, 2, -1, 0, -700, 2354],
  [2, 1, -2, 0, 691, 0],
  [2, -1, 0, -2, 596, 0],
  [4, 0, 1, 0, 549, -1423],
  [0, 0, 4, 0, 537, -1117],
  [4, -1, 0, 0, 520, -1571],
  [1, 0, -2, 0, -487, -1739],
  [2, 1, 0, -2, -399, 0],
  [0, 0, 2, -2, -381, -4421],
  [1, 1, 1, 0, 351, 0],
  [3, 0, -2, 0, -340, 0],
  [4, 0, -3, 0, 330, 0],
  [2, -1, 2, 0, 327, 0],
  [0, 2, 1, 0, -323, 1165],
  [1, 1, -1, 0, 299, 0],
  [2, 0, 3, 0, 294, 0],
  [2, 0, -1, -2, 0, 8752]
];

const LAT_TERMS = [
  [0, 0, 0, 1, 5128122],
  [0, 0, 1, 1, 280602],
  [0, 0, 1, -1, 277693],
  [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413],
  [2, 0, -1, -1, 46271],
  [2, 0, 0, 1, 32573],
  [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266],
  [0, 0, 2, -1, 8822],
  [2, -1, 0, -1, 8216],
  [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200],
  [2, 1, 0, -1, -3359],
  [2, -1, -1, 1, 2463],
  [2, -1, 0, 1, 2211],
  [2, -1, -1, -1, 2065],
  [0, 1, -1, -1, -1870],
  [4, 0, -1, -1, 1828],
  [0, 1, 0, 1, -1794],
  [0, 0, 0, 3, -1749],
  [0, 1, -1, 1, -1565],
  [1, 0, 0, 1, -1491],
  [0, 1, 1, 1, -1475],
  [0, 1, 1, -1, -1410],
  [0, 1, 0, -1, -1344],
  [1, 0, 0, -1, -1335],
  [0, 0, 3, 1, 1107],
  [4, 0, 0, -1, 1021],
  [4, 0, -1, 1, 833],
  [0, 0, 1, -3, 777],
  [4, 0, -2, 1, 671],
  [2, 0, 0, -3, 607],
  [2, 0, 2, -1, 596],
  [2, -1, 1, -1, 491],
  [2, 0, -2, 1, -451],
  [0, 0, 3, -1, 439],
  [2, 0, 2, 1, 422],
  [2, 0, -3, -1, 421],
  [2, 1, -1, 1, -366],
  [2, 1, 0, 1, -351],
  [4, 0, 0, 1, 331],
  [2, -1, 1, 1, 315],
  [2, -2, 0, -1, 302],
  [0, 0, 1, 3, -283],
  [2, 1, 1, -1, -229],
  [1, 1, 0, -1, 223],
  [1, 1, 0, 1, 223],
  [0, 1, -2, -1, -220],
  [2, 1, -1, -1, -220],
  [1, 0, 1, 1, -185],
  [2, -1, -2, -1, 181],
  [0, 1, 2, 1, -177],
  [4, 0, -2, -1, 176],
  [4, -1, -1, -1, 166],
  [1, 0, 1, -1, -164],
  [4, 0, 1, -1, 132],
  [1, 0, -1, -1, -119],
  [4, -1, 0, -1, 115],
  [2, -2, 0, 1, 107]
];

export function calculateMoon(jd: number, TE: number, deltaPsi: number, eps: number, GHAAtrue: number, sunLambda: number, sunRA: number, sunDec: number): MoonResult {
  const { abs, round } = Math;

  const Lmoon_mean = norm360(218.3164591 + 481267.88134236 * TE - 0.0013268 * TE * TE + TE * TE * TE / 538841 - TE * TE * TE * TE / 65194000);
  const D = norm360(297.8502042 + 445267.1115168 * TE - 0.00163 * TE * TE + TE * TE * TE / 545868 - TE * TE * TE * TE / 113065000);
  const Msun_mean = norm360(357.5291092 + 35999.0502909 * TE - 0.0001536 * TE * TE + TE * TE * TE / 24490000);
  const Mmoon_mean = norm360(134.9634114 + 477198.8676313 * TE + 0.008997 * TE * TE + TE * TE * TE / 69699 - TE * TE * TE * TE / 14712000);
  const F = norm360(93.2720993 + 483202.0175273 * TE - 0.0034029 * TE * TE - TE * TE * TE / 3526000 + TE * TE * TE * TE / 863310000);

  const A1 = norm360(119.75 + 131.849 * TE);
  const A2 = norm360(53.09 + 479264.29 * TE);
  const A3 = norm360(313.45 + 481266.484 * TE);

  const fE = 1 - 0.002516 * TE - 0.0000074 * TE * TE;
  const fE2 = fE * fE;

  let sumL = 0;
  let sumR = 0;

  for (let i = 0; i < MOON_TERMS.length; i++) {
    const term = MOON_TERMS[i];
    let f = 1;
    const msAbs = abs(term[1]);
    if (msAbs === 1) f = fE;
    else if (msAbs === 2) f = fE2;
    
    const arg = term[0] * D + term[1] * Msun_mean + term[2] * Mmoon_mean + term[3] * F;
    sumL += f * term[4] * sind(arg);
    sumR += f * term[5] * cosd(arg);
  }

  let sumB = 0;
  for (let i = 0; i < LAT_TERMS.length; i++) {
    const term = LAT_TERMS[i];
    let f = 1;
    const msAbs = abs(term[1]);
    if (msAbs === 1) f = fE;
    else if (msAbs === 2) f = fE2;
    
    const arg = term[0] * D + term[1] * Msun_mean + term[2] * Mmoon_mean + term[3] * F;
    sumB += f * term[4] * sind(arg);
  }

  sumL = sumL + 3958 * sind(A1) + 1962 * sind(Lmoon_mean - F) + 318 * sind(A2);
  sumB = sumB - 2235 * sind(Lmoon_mean) + 382 * sind(A3) + 175 * sind(A1 - F) + 175 * sind(A1 + F) + 127 * sind(Lmoon_mean - Mmoon_mean) - 115 * sind(Lmoon_mean + Mmoon_mean);

  const lambdaM = norm360(Lmoon_mean + sumL / 1000000);
  const betaM = sumB / 1000000;
  const dEM = 385000.56 + sumR / 1000;

  const lambdaMapp = lambdaM + deltaPsi;
  const RA = norm360(atan2d((sind(lambdaMapp) * cosd(eps) - tand(betaM) * sind(eps)), cosd(lambdaMapp)));
  const DEC = asind(sind(betaM) * cosd(eps) + cosd(betaM) * sind(eps) * sind(lambdaMapp));
  const HP = 3600 * asind(6378.14 / dEM);
  const SD = 3600 * asind(1738 / dEM);

  const phaseAngle = lambdaMapp - sunLambda;
  const illumination = 100 * (1 - cosd(phaseAngle)) / 2;
  const xMoon = norm360(phaseAngle);

  return { 
    RA, DEC, 
    GHA: norm360(GHAAtrue - RA), 
    SHA: norm360(360 - RA), 
    SD, HP, 
    illumination: round(10 * illumination) / 10, 
    isWaxing: (xMoon > 0 && xMoon < 180), 
    distance: dEM 
  };
}
