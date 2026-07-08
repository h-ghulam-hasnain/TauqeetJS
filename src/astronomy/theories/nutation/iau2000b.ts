import { timeArguments } from '../../time/JulianDate.js';
import type { NutationResult } from '../../types/ephemeris.js';

export function computeNutation(j: number, ut: number, deltaT: number): NutationResult {
  const { te: T } = timeArguments(j, ut, deltaT);

  const as2r = 4.848136811095359935899141e-6;
  const twopi = 6.283185307179586476925287;

  const L = ((485868.249036 + 1717915923.2178 * T) % 1296000.0) * as2r;
  const Lp = ((1287104.79305 + 129596581.0481 * T) % 1296000.0) * as2r;
  const F = ((335779.526232 + 1739527262.8478 * T) % 1296000.0) * as2r;
  const D = ((1072260.70369 + 1602961601.2090 * T) % 1296000.0) * as2r;
  const Om = ((450160.398036 - 6962890.5431 * T) % 1296000.0) * as2r;

  let dp = 0;
  let de = 0;
  let arg = 0, sinarg = 0, cosarg = 0;

  arg = (L + Lp + 2 * F + -2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 1290 * sinarg; de += -556 * cosarg;
  arg = (-1 * L + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 1405 * sinarg + 4 * cosarg; de += -610 * cosarg + 2 * sinarg;
  arg = (-2 * L + 2 * F + 2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 1383 * sinarg + -2 * cosarg; de += -594 * cosarg + -2 * sinarg;
  arg = (L + 2 * F + 2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -1331 * sinarg + 8 * cosarg; de += 663 * cosarg + 4 * sinarg;
  arg = (-2 * Lp + 2 * F + -2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -1283 * sinarg; de += 672 * cosarg;
  arg = (-1 * L + Lp + D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 1314 * sinarg; de += -700 * cosarg;
  arg = (-1 * L + 2 * F + 4 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -1521 * sinarg + 9 * cosarg; de += 647 * cosarg + 4 * sinarg;
  arg = (2 * F + D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 1660 * sinarg + -5 * cosarg; de += -710 * cosarg + -2 * sinarg;
  arg = (-1 * L + D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 4026 * sinarg + -353 * cosarg; de += -553 * cosarg + -139 * sinarg;
  arg = (L + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -1981 * sinarg; de += 854 * cosarg;
  arg = (-1 * L + 2 * F + -2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -1987 * sinarg + -6 * cosarg; de += 1073 * cosarg + -2 * sinarg;
  arg = (L + 2 * F) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 3339 * sinarg + -13 * cosarg; de += -107 * cosarg + 1 * sinarg;
  arg = (L + Lp) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -3389 * sinarg + 5 * cosarg; de += 35 * cosarg + -2 * sinarg;
  arg = (-1 * L + Lp + D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 3276 * sinarg + 1 * cosarg; de += -9 * cosarg;
  arg = (2 * L + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 2179 * sinarg + -2 * cosarg; de += -1129 * cosarg + -2 * sinarg;
  arg = (L + Lp + 2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 2481 * sinarg + -7 * cosarg; de += -1062 * cosarg + -3 * sinarg;
  arg = (-2 * L + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -2294 * sinarg + -10 * cosarg; de += 1266 * cosarg + -4 * sinarg;
  arg = (-1 * Lp + 2 * F + 2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -2647 * sinarg + 11 * cosarg; de += 1129 * cosarg + 5 * sinarg;
  arg = (-1 * L + 2 * F) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -4056 * sinarg + 5 * cosarg; de += 40 * cosarg + -2 * sinarg;
  arg = (-1 * L + -1 * Lp + 2 * F + 2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -2819 * sinarg + 7 * cosarg; de += 1207 * cosarg + 3 * sinarg;
  arg = (D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -4230 * sinarg + 5 * cosarg; de += -20 * cosarg + -2 * sinarg;
  arg = (L + -1 * Lp + 2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -2878 * sinarg + 8 * cosarg; de += 1232 * cosarg + 4 * sinarg;
  arg = (-1 * Lp + 2 * D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 4348 * sinarg + -10 * cosarg; de += -81 * cosarg + 2 * sinarg;
  arg = (3 * L + 2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -2904 * sinarg + 15 * cosarg; de += 1233 * cosarg + 7 * sinarg;
  arg = (-2 * L + 2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -3075 * sinarg + -2 * cosarg; de += 1313 * cosarg + -1 * sinarg;
  arg = (L + -1 * Lp) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 4725 * sinarg + -6 * cosarg; de += -41 * cosarg + 3 * sinarg;
  arg = (Lp + 2 * F + -2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 3579 * sinarg + 5 * cosarg; de += -1900 * cosarg + 1 * sinarg;
  arg = (L + 2 * D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 6579 * sinarg + -24 * cosarg; de += -199 * cosarg + 2 * sinarg;
  arg = (2 * L + -2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 4065 * sinarg + 6 * cosarg; de += -2206 * cosarg + 1 * sinarg;
  arg = (-1 * L + -1 * Lp + 2 * D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 7350 * sinarg + -8 * cosarg; de += -51 * cosarg + 4 * sinarg;
  arg = (-2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-4940 + -11 * T) * sinarg + -21 * cosarg; de += 2720 * cosarg + -9 * sinarg;
  arg = (-1 * Lp + 2 * F + -2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-4752 + -11 * T) * sinarg + -3 * cosarg; de += 2719 * cosarg + -3 * sinarg;
  arg = (2 * L + 2 * F + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -5350 * sinarg + 21 * cosarg; de += 2695 * cosarg + 12 * sinarg;
  arg = (-2 * L + 2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-5774 + -11 * T) * sinarg + -15 * cosarg; de += 3041 * cosarg + -5 * sinarg;
  arg = (2 * L + 2 * F + -2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 6443 * sinarg + -7 * cosarg; de += -2768 * cosarg + -4 * sinarg;
  arg = (L + 2 * F + -2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (5800 + 10 * T) * sinarg + 2 * cosarg; de += -3045 * cosarg + -1 * sinarg;
  arg = (2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-6302 + -11 * T) * sinarg + 2 * cosarg; de += 3272 * cosarg + 4 * sinarg;
  arg = (-1 * Lp + 2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-7141 + 21 * T) * sinarg + 8 * cosarg; de += 3070 * cosarg + 4 * sinarg;
  arg = (2 * F + 2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-6637 + -11 * T) * sinarg + 25 * cosarg; de += 3353 * cosarg + 14 * sinarg;
  arg = (Lp + 2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (7566 + -21 * T) * sinarg + -11 * cosarg; de += -3250 * cosarg + -5 * sinarg;
  arg = (-2 * L + 2 * F) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -11024 * sinarg + -14 * cosarg; de += 104 * cosarg + 2 * sinarg;
  arg = (L + 2 * F + 2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -7691 * sinarg + 44 * cosarg; de += 3268 * cosarg + 19 * sinarg;
  arg = (2 * Lp) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (16707 + -85 * T) * sinarg + -10 * cosarg; de += (168 + -1 * T) * cosarg + 10 * sinarg;
  arg = (-1 * L + 2 * F + 2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -10204 * sinarg + 25 * cosarg; de += 5222 * cosarg + 15 * sinarg;
  arg = (-1 * Lp + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-12654 + 11 * T) * sinarg + 63 * cosarg; de += 6415 * cosarg + 26 * sinarg;
  arg = (L + -2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-12873 + -10 * T) * sinarg + -37 * cosarg; de += 6953 * cosarg + -14 * sinarg;
  arg = (-2 * F + 2 * D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 21783 * sinarg + 13 * cosarg; de += -167 * cosarg + 13 * sinarg;
  arg = (2 * Lp + 2 * F + -2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-15794 + 72 * T) * sinarg + -16 * cosarg; de += (6850 + -42 * T) * cosarg + -5 * sinarg;
  arg = (-1 * L + 2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (15164 + 10 * T) * sinarg + 11 * cosarg; de += -8001 * cosarg + -1 * sinarg;
  arg = (Lp + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-14053 + -25 * T) * sinarg + 79 * cosarg; de += (8551 + -2 * T) * cosarg + -45 * sinarg;
  arg = (2 * F) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 25887 * sinarg + -66 * cosarg; de += -550 * cosarg + 11 * sinarg;
  arg = (2 * L) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 29243 * sinarg + -74 * cosarg; de += -609 * cosarg + 13 * sinarg;
  arg = (-1 * L + 2 * F + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (20441 + 21 * T) * sinarg + 10 * cosarg; de += -10758 * cosarg + -3 * sinarg;
  arg = (L + 2 * F + -2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 28593 * sinarg + -1 * cosarg; de += (-12338 + 10 * T) * cosarg + -3 * sinarg;
  arg = (2 * L + 2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-31046 + -1 * T) * sinarg + 131 * cosarg; de += (13238 + -11 * T) * cosarg + 59 * sinarg;
  arg = (-2 * L + 2 * D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += -47722 * sinarg + -18 * cosarg; de += 477 * cosarg + -25 * sinarg;
  arg = (-2 * Lp + 2 * F + -2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += 32481 * sinarg; de += -13870 * cosarg;
  arg = (2 * F + 2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-38571 + -1 * T) * sinarg + 158 * cosarg; de += (16452 + -11 * T) * cosarg + 68 * sinarg;
  arg = (2 * D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (63384 + 11 * T) * sinarg + -150 * cosarg; de += -1220 * cosarg + 29 * sinarg;
  arg = (-2 * L + 2 * F + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (45893 + 50 * T) * sinarg + 31 * cosarg; de += (-24236 + -10 * T) * cosarg + 20 * sinarg;
  arg = (L + 2 * F + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-51613 + -42 * T) * sinarg + 129 * cosarg; de += 26366 * cosarg + 78 * sinarg;
  arg = (-1 * L + 2 * F + 2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-59641 + -11 * T) * sinarg + 149 * cosarg; de += (25543 + -11 * T) * cosarg + 66 * sinarg;
  arg = (-1 * L + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-57976 + -63 * T) * sinarg + -189 * cosarg; de += 31429 * cosarg + -75 * sinarg;
  arg = (L + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (63110 + 63 * T) * sinarg + 27 * cosarg; de += -33228 * cosarg + -9 * sinarg;
  arg = (-1 * L + 2 * D) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (156994 + 10 * T) * sinarg + -168 * cosarg; de += -1235 * cosarg + 82 * sinarg;
  arg = (-1 * L + 2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (123457 + 11 * T) * sinarg + 19 * cosarg; de += (-53311 + 32 * T) * cosarg + -4 * sinarg;
  arg = (2 * F + -2 * D + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (128227 + 137 * T) * sinarg + 181 * cosarg; de += (-68982 + -9 * T) * cosarg + 39 * sinarg;
  arg = (-1 * Lp + 2 * F + -2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (215829 + -494 * T) * sinarg + 111 * cosarg; de += (-95929 + 299 * T) * cosarg + 132 * sinarg;
  arg = (L + 2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-301461 + -36 * T) * sinarg + 816 * cosarg; de += (129025 + -63 * T) * cosarg + 367 * sinarg;
  arg = (2 * F + Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-387298 + -367 * T) * sinarg + 380 * cosarg; de += (200728 + 18 * T) * cosarg + 318 * sinarg;
  arg = (L) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (711159 + 73 * T) * sinarg + -872 * cosarg; de += -6750 * cosarg + 358 * sinarg;
  arg = (Lp + 2 * F + -2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-516821 + 1226 * T) * sinarg + -524 * cosarg; de += (224386 + -677 * T) * cosarg + -174 * sinarg;
  arg = (Lp) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (1475877 + -3633 * T) * sinarg + 11817 * cosarg; de += (73871 + -184 * T) * cosarg + -1924 * sinarg;
  arg = (2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (2074554 + 207 * T) * sinarg + -698 * cosarg; de += (-897492 + 470 * T) * cosarg + -291 * sinarg;
  arg = (2 * F + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-2276413 + -234 * T) * sinarg + 2796 * cosarg; de += (978459 + -485 * T) * cosarg + 1374 * sinarg;
  arg = (2 * F + -2 * D + 2 * Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-13170906 + -1675 * T) * sinarg + -13696 * cosarg; de += (5730336 + -3015 * T) * cosarg + -4587 * sinarg;
  arg = (Om) % twopi; sinarg = Math.sin(arg); cosarg = Math.cos(arg); dp += (-172064161 + -174666 * T) * sinarg + 33386 * cosarg; de += (92052331 + 9086 * T) * cosarg + 15377 * sinarg;

  // Convert from 0.1 mas to arcseconds, then to degrees
  const deltaPsi = (dp / 1e7) / 3600.0 - 0.135 / 1e3 / 3600.0;
  const deltaEps = (de / 1e7) / 3600.0 + 0.388 / 1e3 / 3600.0;

  // IAU 2000A/B mean obliquity (eps0) in arcseconds, converted to degrees
  // eps0 = 84381.406 - 46.836769*T - 0.0001831*T^2 + 0.00200340*T^3 - 0.000000576*T^4 - 0.0000000434*T^5
  const eps0_arcsec = 84381.406 + T * (-46.836769 + T * (-0.0001831 + T * (0.00200340 + T * (-0.000000576 + T * -0.0000000434))));
  const eps0 = eps0_arcsec / 3600.0;
  const eps = eps0 + deltaEps;

  return { deltaPsi, deltaEps, eps0, eps };
}
