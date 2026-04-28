/**
 * High-precision Lunar Ephemeris calculations.
 * Based on Meeus, Astronomical Algorithms.
 */
import { atan2d, cosd, norm360, sind, tand, asind, DTR } from '../core/math.js';

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

export function calculateMoon(jd: number, TE: number, deltaPsi: number, eps: number, GHAAtrue: number, sunLambda: number, sunRA: number, sunDec: number): MoonResult {
  const { abs, round, sin, cos, atan2, asin, floor } = Math;

  // Mean longitude of the moon
  const Lmoon_mean = norm360(218.3164591 + 481267.88134236 * TE - 0.0013268 * TE ** 2 + TE ** 3 / 538841 - TE ** 4 / 65194000);

  // Mean elongation of the moon
  const D = norm360(297.8502042 + 445267.1115168 * TE - 0.00163 * TE ** 2 + TE ** 3 / 545868 - TE ** 4 / 113065000);

  // Mean anomaly of the sun
  const Msun_mean = norm360(357.5291092 + 35999.0502909 * TE - 0.0001536 * TE ** 2 + TE ** 3 / 24490000);

  // Mean anomaly of the moon
  const Mmoon_mean = norm360(134.9634114 + 477198.8676313 * TE + 0.008997 * TE ** 2 + TE ** 3 / 69699 - TE ** 4 / 14712000);

  // Mean distance of the moon from her ascending node
  const F = norm360(93.2720993 + 483202.0175273 * TE - 0.0034029 * TE ** 2 - TE ** 3 / 3526000 + TE ** 4 / 863310000);

  // Corrections
  let A1 = norm360(119.75 + 131.849 * TE);
  let A2 = norm360(53.09 + 479264.29 * TE);
  let A3 = norm360(313.45 + 481266.484 * TE);

  const fE = 1 - 0.002516 * TE - 0.0000074 * TE ** 2;
  const fE2 = fE * fE;

  // Periodic terms (simplified selection from script.js)
  // For brevity and parity with the user's script.js loop (60 terms)
  // I will use a data-driven approach similar to the original script.
  
  const terms = [
    {d:0, ms:0, mm:1, f:0, s:6288774, c:-20905355},
    {d:2, ms:0, mm:-1, f:0, s:1274027, c:-3699111},
    {d:2, ms:0, mm:0, f:0, s:658314, c:-2955968},
    {d:0, ms:0, mm:2, f:0, s:213618, c:-569925},
    {d:0, ms:1, mm:0, f:0, s:-185116, c:48888},
    {d:0, ms:0, mm:0, f:2, s:-114332, c:-3149},
    {d:2, ms:0, mm:-2, f:0, s:58793, c:246158},
    {d:2, ms:-1, mm:-1, f:0, s:57066, c:-152138},
    {d:2, ms:0, mm:1, f:0, s:53322, c:-170733},
    {d:2, ms:-1, mm:0, f:0, s:45758, c:-204586},
    {d:0, ms:1, mm:-1, f:0, s:-40923, c:-129620},
    {d:1, ms:0, mm:0, f:0, s:-34720, c:108743},
    {d:0, ms:1, mm:1, f:0, s:-30383, c:104755},
    {d:2, ms:0, mm:0, f:-2, s:15327, c:10321},
    {d:0, ms:0, mm:1, f:2, s:-12528, c:0},
    {d:0, ms:0, mm:1, f:-2, s:10980, c:79661},
    {d:4, ms:0, mm:-1, f:0, s:10675, c:-34782},
    {d:0, ms:0, mm:3, f:0, s:10034, c:-23210},
    {d:4, ms:0, mm:-2, f:0, s:8548, c:-21636},
    {d:2, ms:1, mm:-1, f:0, s:-7888, c:24208},
    {d:2, ms:1, mm:0, f:0, s:-6766, c:30824},
    {d:1, ms:0, mm:-1, f:0, s:-5163, c:-8379},
    {d:1, ms:1, mm:0, f:0, s:4987, c:-16675},
    {d:2, ms:-1, mm:1, f:0, s:4036, c:-12831},
    {d:2, ms:0, mm:2, f:0, s:3994, c:-10445},
    {d:4, ms:0, mm:0, f:0, s:3861, c:-11650},
    {d:2, ms:0, mm:-3, f:0, s:3665, c:14403},
    {d:0, ms:1, mm:-2, f:0, s:-2689, c:-7003},
    {d:2, ms:0, mm:-1, f:2, s:-2602, c:0},
    {d:2, ms:-1, mm:-2, f:0, s:2390, c:10056},
    {d:1, ms:0, mm:1, f:0, s:-2348, c:6322},
    {d:2, ms:-2, mm:0, f:0, s:2236, c:-9884},
    {d:0, ms:1, mm:2, f:0, s:-2120, c:5751},
    {d:0, ms:2, mm:0, f:0, s:-2069, c:0},
    {d:2, ms:-2, mm:-1, f:0, s:2048, c:-4950},
    {d:2, ms:0, mm:1, f:-2, s:-1773, c:4130},
    {d:2, ms:0, mm:0, f:2, s:-1595, c:0},
    {d:4, ms:-1, mm:-1, f:0, s:1215, c:-3958},
    {d:0, ms:0, mm:2, f:2, s:-1110, c:0},
    {d:3, ms:0, mm:-1, f:0, s:-892, c:3258},
    {d:2, ms:1, mm:1, f:0, s:-810, c:2616},
    {d:4, ms:-1, mm:-2, f:0, s:759, c:-1897},
    {d:0, ms:2, mm:-1, f:0, s:-713, c:-2117},
    {d:2, ms:2, mm:-1, f:0, s:-700, c:2354},
    {d:2, ms:1, mm:-2, f:0, s:691, c:0},
    {d:2, ms:-1, mm:0, f:-2, s:596, c:0},
    {d:4, ms:0, mm:1, f:0, s:549, c:-1423},
    {d:0, ms:0, mm:4, f:0, s:537, c:-1117},
    {d:4, ms:-1, mm:0, f:0, s:520, c:-1571},
    {d:1, ms:0, mm:-2, f:0, s:-487, c:-1739},
    {d:2, ms:1, mm:0, f:-2, s:-399, c:0},
    {d:0, ms:0, mm:2, f:-2, s:-381, c:-4421},
    {d:1, ms:1, mm:1, f:0, s:351, c:0},
    {d:3, ms:0, mm:-2, f:0, s:-340, c:0},
    {d:4, ms:0, mm:-3, f:0, s:330, c:0},
    {d:2, ms:-1, mm:2, f:0, s:327, c:0},
    {d:0, ms:2, mm:1, f:0, s:-323, c:1165},
    {d:1, ms:1, mm:-1, f:0, s:299, c:0},
    {d:2, ms:0, mm:3, f:0, s:294, c:0},
    {d:2, ms:0, mm:-1, f:-2, s:0, c:8752}
  ];

  let sumL = 0;
  let sumR = 0;

  for (const term of terms) {
    let f = 1;
    if (abs(term.ms) === 1) f = fE;
    if (abs(term.ms) === 2) f = fE2;
    const arg = term.d * D + term.ms * Msun_mean + term.mm * Mmoon_mean + term.f * F;
    sumL += f * term.s * sind(arg);
    sumR += f * term.c * cosd(arg);
  }

  // Latitude terms
  const latTerms = [
    {d:0, ms:0, mm:0, f:1, s:5128122},
    {d:0, ms:0, mm:1, f:1, s:280602},
    {d:0, ms:0, mm:1, f:-1, s:277693},
    {d:2, ms:0, mm:0, f:-1, s:173237},
    {d:2, ms:0, mm:-1, f:1, s:55413},
    {d:2, ms:0, mm:-1, f:-1, s:46271},
    {d:2, ms:0, mm:0, f:1, s:32573},
    {d:0, ms:0, mm:2, f:1, s:17198},
    {d:2, ms:0, mm:1, f:-1, s:9266},
    {d:0, ms:0, mm:2, f:-1, s:8822},
    {d:2, ms:-1, mm:0, f:-1, s:8216},
    {d:2, ms:0, mm:-2, f:-1, s:4324},
    {d:2, ms:0, mm:1, f:1, s:4200},
    {d:2, ms:1, mm:0, f:-1, s:-3359},
    {d:2, ms:-1, mm:-1, f:1, s:2463},
    {d:2, ms:-1, mm:0, f:1, s:2211},
    {d:2, ms:-1, mm:-1, f:-1, s:2065},
    {d:0, ms:1, mm:-1, f:-1, s:-1870},
    {d:4, ms:0, mm:-1, f:-1, s:1828},
    {d:0, ms:1, mm:0, f:1, s:-1794},
    {d:0, ms:0, mm:0, f:3, s:-1749},
    {d:0, ms:1, mm:-1, f:1, s:-1565},
    {d:1, ms:0, mm:0, f:1, s:-1491},
    {d:0, ms:1, mm:1, f:1, s:-1475},
    {d:0, ms:1, mm:1, f:-1, s:-1410},
    {d:0, ms:1, mm:0, f:-1, s:-1344},
    {d:1, ms:0, mm:0, f:-1, s:-1335},
    {d:0, ms:0, mm:3, f:1, s:1107},
    {d:4, ms:0, mm:0, f:-1, s:1021},
    {d:4, ms:0, mm:-1, f:1, s:833},
    {d:0, ms:0, mm:1, f:-3, s:777},
    {d:4, ms:0, mm:-2, f:1, s:671},
    {d:2, ms:0, mm:0, f:-3, s:607},
    {d:2, ms:0, mm:2, f:-1, s:596},
    {d:2, ms:-1, mm:1, f:-1, s:491},
    {d:2, ms:0, mm:-2, f:1, s:-451},
    {d:0, ms:0, mm:3, f:-1, s:439},
    {d:2, ms:0, mm:2, f:1, s:422},
    {d:2, ms:0, mm:-3, f:-1, s:421},
    {d:2, ms:1, mm:-1, f:1, s:-366},
    {d:2, ms:1, mm:0, f:1, s:-351},
    {d:4, ms:0, mm:0, f:1, s:331},
    {d:2, ms:-1, mm:1, f:1, s:315},
    {d:2, ms:-2, mm:0, f:-1, s:302},
    {d:0, ms:0, mm:1, f:3, s:-283},
    {d:2, ms:1, mm:1, f:-1, s:-229},
    {d:1, ms:1, mm:0, f:-1, s:223},
    {d:1, ms:1, mm:0, f:1, s:223},
    {d:0, ms:1, mm:-2, f:-1, s:-220},
    {d:2, ms:1, mm:-1, f:-1, s:-220},
    {d:1, ms:0, mm:1, f:1, s:-185},
    {d:2, ms:-1, mm:-2, f:-1, s:181},
    {d:0, ms:1, mm:2, f:1, s:-177},
    {d:4, ms:0, mm:-2, f:-1, s:176},
    {d:4, ms:-1, mm:-1, f:-1, s:166},
    {d:1, ms:0, mm:1, f:-1, s:-164},
    {d:4, ms:0, mm:1, f:-1, s:132},
    {d:1, ms:0, mm:-1, f:-1, s:-119},
    {d:4, ms:-1, mm:0, f:-1, s:115},
    {d:2, ms:-2, mm:0, f:1, s:107}
  ];

  let sumB = 0;
  for (const term of latTerms) {
    let f = 1;
    if (abs(term.ms) === 1) f = fE;
    if (abs(term.ms) === 2) f = fE2;
    const arg = term.d * D + term.ms * Msun_mean + term.mm * Mmoon_mean + term.f * F;
    sumB += f * term.s * sind(arg);
  }

  // Final corrections
  sumL = sumL + 3958 * sind(A1) + 1962 * sind(Lmoon_mean - F) + 318 * sind(A2);
  sumB = sumB - 2235 * sind(Lmoon_mean) + 382 * sind(A3) + 175 * sind(A1 - F) + 175 * sind(A1 + F) + 127 * sind(Lmoon_mean - Mmoon_mean) - 115 * sind(Lmoon_mean + Mmoon_mean);

  const lambdaM = norm360(Lmoon_mean + sumL / 1000000);
  const betaM = sumB / 1000000;
  const dEM = 385000.56 + sumR / 1000;

  const lambdaMapp = lambdaM + deltaPsi;
  const RA = norm360(atan2d((sind(lambdaMapp) * cosd(eps) - tand(betaM) * sind(eps)), cosd(lambdaMapp)));
  const SHA = norm360(360 - RA);
  const DEC = asind(sind(betaM) * cosd(eps) + cosd(betaM) * sind(eps) * sind(lambdaMapp));
  const GHA = norm360(GHAAtrue - RA);

  const HP = 3600 * asind(6378.14 / dEM);
  const SD = 3600 * asind(1738 / dEM);

  // Illumination
  let phaseAngle = lambdaMapp - sunLambda;
  const illumination = 100 * (1 - cosd(phaseAngle)) / 2;
  const xMoon = norm360(phaseAngle);
  const isWaxing = (xMoon > 0 && xMoon < 180);

  return { 
    RA, DEC, GHA, SHA, SD, HP, 
    illumination: round(10 * illumination) / 10, 
    isWaxing, 
    distance: dEM 
  };
}
