/**
 * IAU 1980 Nutation Theory.
 * Perfectly synchronized with Henning Umland's Almanac.html logic.
 */
import { cosd, norm360, sind, DTR } from '../core/math.js';

// The exact data table from script.js
const RAW_NUT_DATA = [
  " 0 0 0 0 1-171996-174.2 92025 8.9 ",
  " 0 0 2-2 2 -13187  -1.6  5736-3.1 ",
  " 0 0 2 0 2  -2274  -0.2   977-0.5 ",
  " 0 0 0 0 2   2062   0.2  -895 0.5 ",
  " 0-1 0 0 0  -1426   3.4    54-0.1 ",
  " 1 0 0 0 0    712   0.1    -7 0.0 ",
  " 0 1 2-2 2   -517   1.2   224-0.6 ",
  " 0 0 2 0 1   -386  -0.4   200 0.0 ",
  " 1 0 2 0 2   -301   0.0   129-0.1 ",
  " 0-1 2-2 2    217  -0.5   -95 0.3 ",
  "-1 0 0 2 0    158   0.0    -1 0.0 ",
  " 0 0 2-2 1    129   0.1   -70 0.0 ",
  "-1 0 2 0 2    123   0.0   -53 0.0 ",
  " 1 0 0 0 1     63   0.1   -33 0.0 ",
  " 0 0 0 2 0     63   0.0    -2 0.0 ",
  "-1 0 2 2 2    -59   0.0    26 0.0 ",
  "-1 0 0 0 1    -58  -0.1    32 0.0 ",
  " 1 0 2 0 1    -51   0.0    27 0.0 ",
  "-2 0 0 2 0    -48   0.0     1 0.0 ",
  "-2 0 2 0 1     46   0.0   -24 0.0 ",
  " 0 0 2 2 2    -38   0.0    16 0.0 ",
  " 2 0 2 0 2    -31   0.0    13 0.0 ",
  " 2 0 0 0 0     29   0.0    -1 0.0 ",
  " 1 0 2-2 2     29   0.0   -12 0.0 ",
  " 0 0 2 0 0     26   0.0    -1 0.0 ",
  " 0 0 2-2 0    -22   0.0     0 0.0 ",
  "-1 0 2 0 1     21   0.0   -10 0.0 ",
  " 0 2 0 0 0     17  -0.1     0 0.0 ",
  " 0 2 2-2 2    -16   0.1     7 0.0 ",
  "-1 0 0 2 1     16   0.0    -8 0.0 ",
  " 0 1 0 0 1    -15   0.0     9 0.0 ",
  " 1 0 0-2 1    -13   0.0     7 0.0 ",
  " 0-1 0 0 1    -12   0.0     6 0.0 ",
  " 2 0-2 0 0     11   0.0     0 0.0 ",
  "-1 0 2 2 1    -10   0.0     5 0.0 ",
  " 1 0 2 2 2     -8   0.0     3 0.0 ",
  " 0-1 2 0 2     -7   0.0     3 0.0 ",
  " 0 0 2 2 1     -7   0.0     3 0.0 ",
  " 1 1 0-2 0     -7   0.0     0 0.0 ",
  " 0 1 2 0 2      7   0.0    -3 0.0 ",
  "-2 0 0 2 1     -6   0.0     3 0.0 ",
  " 0 0 0 2 1     -6   0.0     3 0.0 ",
  " 2 0 2-2 2      6   0.0    -3 0.0 ",
  " 1 0 0 2 0      6   0.0     0 0.0 ",
  " 1 0 2-2 1      6   0.0    -3 0.0 ",
  " 0 0 0-2 1     -5   0.0     3 0.0 ",
  " 0-1 2-2 1     -5   0.0     3 0.0 ",
  " 2 0 2 0 1     -5   0.0     3 0.0 ",
  " 1-1 0 0 0      5   0.0     0 0.0 ",
  " 1 0 0-1 0     -4   0.0     0 0.0 ",
  " 0 0 0 1 0     -4   0.0     0 0.0 ",
  " 0 1 0-2 0     -4   0.0     0 0.0 ",
  " 1 0-2 0 0      4   0.0     0 0.0 ",
  " 2 0 0-2 1      4   0.0    -2 0.0 ",
  " 0 1 2-2 1      4   0.0    -2 0.0 ",
  " 1 1 0 0 0     -3   0.0     0 0.0 ",
  " 1-1 0-1 0     -3   0.0     0 0.0 ",
  "-1-1 2 2 2     -3   0.0     1 0.0 ",
  " 0-1 2 2 2     -3   0.0     1 0.0 ",
  " 1-1 2 0 2     -3   0.0     1 0.0 ",
  " 3 0 2 0 2     -3   0.0     1 0.0 ",
  "-2 0 2 0 2     -3   0.0     1 0.0 ",
  " 1 0 2 0 0      3   0.0     0 0.0 ",
  "-1 0 2 4 2     -2   0.0     1 0.0 ",
  " 1 0 0 0 2     -2   0.0     1 0.0 ",
  "-1 0 2-2 1     -2   0.0     1 0.0 ",
  " 0-2 2-2 1     -2   0.0     1 0.0 ",
  "-2 0 0 0 1     -2   0.0     1 0.0 ",
  " 2 0 0 0 1      2   0.0    -1 0.0 ",
  " 3 0 0 0 0      2   0.0     0 0.0 ",
  " 1 1 2 0 2      2   0.0    -1 0.0 ",
  " 0 0 2 1 2      2   0.0    -1 0.0 ",
  " 1 0 0 2 1     -1   0.0     0 0.0 ",
  " 1 0 2 2 1     -1   0.0     1 0.0 ",
  " 1 1 0-2 1     -1   0.0     0 0.0 ",
  " 0 1 0 2 0     -1   0.0     0 0.0 ",
  " 0 1 2-2 0     -1   0.0     0 0.0 ",
  " 0 1-2 2 0     -1   0.0     0 0.0 ",
  " 1 0-2 2 0     -1   0.0     0 0.0 ",
  " 1 0-2-2 0     -1   0.0     0 0.0 ",
  " 1 0 2-2 0     -1   0.0     0 0.0 ",
  " 1 0 0-4 0     -1   0.0     0 0.0 ",
  " 2 0 0-4 0     -1   0.0     0 0.0 ",
  " 0 0 2 4 2     -1   0.0     0 0.0 ",
  " 0 0 2-1 2     -1   0.0     0 0.0 ",
  "-2 0 2 4 2     -1   0.0     1 0.0 ",
  " 2 0 2 2 2     -1   0.0     0 0.0 ",
  " 0-1 2 0 1     -1   0.0     0 0.0 ",
  " 0 0-2 0 1     -1   0.0     0 0.0 ",
  " 0 0 4-2 2      1   0.0     0 0.0 ",
  " 0 1 0 0 2      1   0.0     0 0.0 ",
  " 1 1 2-2 2      1   0.0    -1 0.0 ",
  " 3 0 2-2 2      1   0.0     0 0.0 ",
  "-2 0 2 2 2      1   0.0    -1 0.0 ",
  "-1 0 0 0 2      1   0.0    -1 0.0 ",
  " 0 0-2 2 1      1   0.0     0 0.0 ",
  " 0 1 2 0 1      1   0.0     0 0.0 ",
  "-1 0 4 0 2      1   0.0     0 0.0 ",
  " 2 1 0-2 0      1   0.0     0 0.0 ",
  " 2 0 0 2 0      1   0.0     0 0.0 ",
  " 2 0 2-2 1      1   0.0    -1 0.0 ",
  " 2 0-2 0 1      1   0.0     0 0.0 ",
  " 1-1 0-2 0      1   0.0     0 0.0 ",
  "-1 0 0 1 1      1   0.0     0 0.0 ",
  "-1-1 0 2 1      1   0.0     0 0.0 ",
  " 0 1 0 1 0      1   0.0     0 0.0 "
];

export interface NutationResult {
  deltaPsi: number;
  deltaEps: number;
  eps0: number;
  eps: number;
}

export function calculateNutation(TE: number): NutationResult {
  const TE2 = TE * TE;
  const TE3 = TE2 * TE;

  // Exact coefficients and normalization logic from script.js
  let localMm = 134.962981389 + 198.867398056 * TE + norm360(477000 * TE) + 0.008697222222 * TE2 + TE3 / 56250;
  let localM = 357.527723333 + 359.05034 * TE + norm360(35640 * TE) - 0.0001602777778 * TE2 - TE3 / 300000;
  let localF = 93.271910277 + 82.017538055 * TE + norm360(483120 * TE) - 0.0036825 * TE2 + TE3 / 327272.7273;
  let localD = 297.850363055 + 307.11148 * TE + norm360(444960 * TE) - 0.001914166667 * TE2 + TE3 / 189473.6842;
  let localOmega = 125.044522222 - 134.136260833 * TE - norm360(1800 * TE) + 0.002070833333 * TE2 + TE3 / 450000;

  // Normalize and convert to Radians BEFORE the loop to match script.js floating point sequence
  const Mm_rad = norm360(localMm) * DTR;
  const M_rad = norm360(localM) * DTR;
  const F_rad = norm360(localF) * DTR;
  const D_rad = norm360(localD) * DTR;
  const omega_rad = norm360(localOmega) * DTR;

  let dp = 0;
  let de = 0;

  for (const entry of RAW_NUT_DATA) {
    const fMm = parseInt(entry.substring(0, 2).trim(), 10);
    const fM = parseInt(entry.substring(2, 4).trim(), 10);
    const fF = parseInt(entry.substring(4, 6).trim(), 10);
    const fD = parseInt(entry.substring(6, 8).trim(), 10);
    const f_omega = parseInt(entry.substring(8, 10).trim(), 10);

    const term1 = parseInt(entry.substring(10, 17).trim(), 10);
    const term1t = parseFloat(entry.substring(17, 23).trim()) || 0;
    const term2 = parseInt(entry.substring(23, 29).trim(), 10);
    const term2t = parseFloat(entry.substring(29, 33).trim()) || 0;

    const arg = fD * D_rad + fM * M_rad + fMm * Mm_rad + fF * F_rad + f_omega * omega_rad;
    
    dp += (term1 + TE * term1t) * Math.sin(arg);
    de += (term2 + TE * term2t) * Math.cos(arg);
  }

  const deltaPsi = dp / 36000000;
  const deltaEps = de / 36000000;

  const eps0 = (84381.448 - 46.815 * TE - 0.00059 * TE2 + 0.001813 * TE3) / 3600;
  const eps = eps0 + deltaEps;

  return { deltaPsi, deltaEps, eps0, eps };
}
