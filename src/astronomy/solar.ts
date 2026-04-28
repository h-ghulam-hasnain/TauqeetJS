/**
 * High-precision Solar Ephemeris calculations.
 * Bit-perfect synchronization with Henning Umland's Almanac.html.
 */
import { atan2d, cosd, norm360, sind, tand, asind } from '../core/math.js';

export interface SolarResult {
  RA: number;
  DEC: number;
  GHA: number;
  SHA: number;
  SD: number;
  HP: number;
  EOT: number;
  distance: number;
  lambdaApp: number;
}

export function calculateSolar(jd: number, deltaPsi: number, eps: number, TE: number, Tau: number, T: number): SolarResult {
  const { cos } = Math;

  // L0 terms
  let L0 = 175347046;
  L0 += 3341656 * cos(4.6692568 + 6283.07585 * Tau);
  L0 += 34894 * cos(4.6261 + 12566.1517 * Tau);
  L0 += 3497 * cos(2.7441 + 5753.3849 * Tau);
  L0 += 3418 * cos(2.8289 + 3.5231 * Tau);
  L0 += 3136 * cos(3.6277 + 77713.7715 * Tau);
  L0 += 2676 * cos(4.4181 + 7860.4194 * Tau);
  L0 += 2343 * cos(6.1352 + 3930.2097 * Tau);
  L0 += 1324 * cos(0.7425 + 11506.7698 * Tau);
  L0 += 1273 * cos(2.0371 + 529.691 * Tau);
  L0 += 1199 * cos(1.1096 + 1577.3435 * Tau);
  L0 += 990 * cos(5.233 + 5884.927 * Tau);
  L0 += 902 * cos(2.045 + 26.298 * Tau);
  L0 += 857 * cos(3.508 + 398.149 * Tau);
  L0 += 780 * cos(1.179 + 5223.694 * Tau);
  L0 += 753 * cos(2.533 + 5507.553 * Tau);
  L0 += 505 * cos(4.583 + 18849.228 * Tau);
  L0 += 492 * cos(4.205 + 775.523 * Tau);
  L0 += 357 * cos(2.92 + 0.067 * Tau);
  L0 += 317 * cos(5.849 + 11790.629 * Tau);
  L0 += 284 * cos(1.899 + 796.298 * Tau);
  L0 += 271 * cos(0.315 + 10977.079 * Tau);
  L0 += 243 * cos(0.345 + 5486.778 * Tau);
  L0 += 206 * cos(4.806 + 2544.314 * Tau);
  L0 += 205 * cos(1.869 + 5573.143 * Tau);
  L0 += 202 * cos(2.458 + 6069.777 * Tau);
  L0 += 156 * cos(0.833 + 213.299 * Tau);
  L0 += 132 * cos(3.411 + 2942.463 * Tau);
  L0 += 126 * cos(1.083 + 20.775 * Tau);
  L0 += 115 * cos(0.645 + 0.98 * Tau);
  L0 += 103 * cos(0.636 + 4694.003 * Tau);
  L0 += 102 * cos(0.976 + 15720.839 * Tau);
  L0 += 102 * cos(4.267 + 7.114 * Tau);
  L0 += 99 * cos(6.21 + 2146.17 * Tau);
  L0 += 98 * cos(0.68 + 155.42 * Tau);
  L0 += 86 * cos(5.98 + 161000.69 * Tau);
  L0 += 85 * cos(1.3 + 6275.96 * Tau);
  L0 += 85 * cos(3.67 + 71430.7 * Tau);
  L0 += 80 * cos(1.81 + 17260.15 * Tau);
  L0 += 79 * cos(3.04 + 12036.46 * Tau);
  L0 += 75 * cos(1.76 + 5088.63 * Tau);
  L0 += 74 * cos(3.5 + 3154.69 * Tau);
  L0 += 74 * cos(4.68 + 801.82 * Tau);
  L0 += 70 * cos(0.83 + 9437.76 * Tau);
  L0 += 62 * cos(3.98 + 8827.39 * Tau);
  L0 += 61 * cos(1.82 + 7084.9 * Tau);
  L0 += 57 * cos(2.78 + 6286.6 * Tau);
  L0 += 56 * cos(4.39 + 14143.5 * Tau);
  L0 += 56 * cos(3.47 + 6279.55 * Tau);
  L0 += 52 * cos(0.19 + 12139.55 * Tau);
  L0 += 52 * cos(1.33 + 1748.02 * Tau);
  L0 += 51 * cos(0.28 + 5856.48 * Tau);
  L0 += 49 * cos(0.49 + 1194.45 * Tau);
  L0 += 41 * cos(5.37 + 8429.24 * Tau);
  L0 += 41 * cos(2.4 + 19651.05 * Tau);
  L0 += 39 * cos(6.17 + 10447.39 * Tau);
  L0 += 37 * cos(6.04 + 10213.29 * Tau);
  L0 += 37 * cos(2.57 + 1059.38 * Tau);
  L0 += 36 * cos(1.71 + 2352.87 * Tau);
  L0 += 36 * cos(1.78 + 6812.77 * Tau);
  L0 += 33 * cos(0.59 + 17789.85 * Tau);
  L0 += 30 * cos(0.44 + 83996.85 * Tau);
  L0 += 30 * cos(2.74 + 1349.87 * Tau);
  L0 += 25 * cos(3.16 + 4690.48 * Tau);

  let L1 = 628331966747;
  L1 += 206059 * cos(2.678235 + 6283.07585 * Tau);
  L1 += 4303 * cos(2.6351 + 12566.1517 * Tau);
  L1 += 425 * cos(1.59 + 3.523 * Tau);
  L1 += 119 * cos(5.796 + 26.298 * Tau);
  L1 += 109 * cos(2.966 + 1577.344 * Tau);
  L1 += 93 * cos(2.59 + 18849.23 * Tau);
  L1 += 72 * cos(1.14 + 529.69 * Tau);
  L1 += 68 * cos(1.87 + 398.15 * Tau);
  L1 += 67 * cos(4.41 + 5507.55 * Tau);
  L1 += 59 * cos(2.89 + 5223.69 * Tau);
  L1 += 56 * cos(2.17 + 155.42 * Tau);
  L1 += 45 * cos(0.4 + 796.3 * Tau);
  L1 += 36 * cos(0.47 + 775.52 * Tau);
  L1 += 29 * cos(2.65 + 7.11 * Tau);
  L1 += 21 * cos(5.34 + 0.98 * Tau);
  L1 += 19 * cos(1.85 + 5486.78 * Tau);
  L1 += 19 * cos(4.97 + 213.3 * Tau);
  L1 += 17 * cos(2.99 + 6275.96 * Tau);
  L1 += 16 * cos(0.03 + 2544.31 * Tau);
  L1 += 16 * cos(1.43 + 2146.17 * Tau);
  L1 += 15 * cos(1.21 + 10977.08 * Tau);
  L1 += 12 * cos(2.83 + 1748.02 * Tau);
  L1 += 12 * cos(3.26 + 5088.63 * Tau);
  L1 += 12 * cos(5.27 + 1194.45 * Tau);
  L1 += 12 * cos(2.08 + 4694.0 * Tau);
  L1 += 11 * cos(0.77 + 553.57 * Tau);
  L1 += 10 * cos(1.3 + 6286.6 * Tau);
  L1 += 10 * cos(4.24 + 1349.87 * Tau);
  L1 += 9 * cos(2.7 + 242.73 * Tau);
  L1 += 9 * cos(5.64 + 951.72 * Tau);
  L1 += 8 * cos(5.3 + 2352.87 * Tau);
  L1 += 6 * cos(2.65 + 9437.76 * Tau);
  L1 += 6 * cos(4.67 + 4690.48 * Tau);

  let L2 = 52919;
  L2 += 8720 * cos(1.0721 + 6283.0758 * Tau);
  L2 += 309 * cos(0.867 + 12566.152 * Tau);
  L2 += 27 * cos(0.05 + 3.52 * Tau);
  L2 += 16 * cos(5.19 + 26.3 * Tau);
  L2 += 16 * cos(3.68 + 155.42 * Tau);
  L2 += 10 * cos(0.76 + 18849.23 * Tau);
  L2 += 9 * cos(2.06 + 77713.77 * Tau);
  L2 += 7 * cos(0.83 + 775.52 * Tau);
  L2 += 5 * cos(4.66 + 1577.34 * Tau);
  L2 += 4 * cos(1.03 + 7.11 * Tau);
  L2 += 4 * cos(3.44 + 5573.14 * Tau);
  L2 += 3 * cos(5.14 + 796.3 * Tau);
  L2 += 3 * cos(6.05 + 5507.55 * Tau);
  L2 += 3 * cos(1.19 + 242.73 * Tau);
  L2 += 3 * cos(6.12 + 529.69 * Tau);
  L2 += 3 * cos(0.31 + 398.15 * Tau);
  L2 += 3 * cos(2.28 + 553.57 * Tau);
  L2 += 2 * cos(4.38 + 5223.69 * Tau);
  L2 += 2 * cos(3.75 + 0.98 * Tau);

  const L3 = (289 * cos(5.844 + 6283.076 * Tau) + 35 + 17 * cos(5.49 + 12566.15 * Tau) + 3 * cos(5.2 + 155.42 * Tau) + cos(4.72 + 3.52 * Tau) + cos(5.3 + 18849.23 * Tau) + cos(5.97 + 242.73 * Tau));

  const L4 = 114 * cos(Math.PI) + 8 * cos(4.13 + 6283.08 * Tau) + cos(3.84 + 12566.15 * Tau);

  const L5 = cos(3.14);

  const Tau2 = Tau * Tau;
  const Tau3 = Tau2 * Tau;
  const Tau4 = Tau3 * Tau;
  const Tau5 = Tau4 * Tau;

  const Lhelioc = norm360((L0 + L1 * Tau + L2 * Tau2 + L3 * Tau3 + L4 * Tau4 + L5 * Tau5) / 1e8 / (Math.PI / 180));
  const LsunTrue = norm360(Lhelioc + 180 - 0.000025);

  let B0 = 280 * cos(3.199 + 84334.662 * Tau);
  B0 += 102 * cos(5.422 + 5507.553 * Tau);
  B0 += 80 * cos(3.88 + 5223.69 * Tau);
  B0 += 44 * cos(3.7 + 2352.87 * Tau);
  B0 += 32 * cos(4 + 1577.34 * Tau);

  let B1 = 9 * cos(3.9 + 5507.55 * Tau) + 6 * cos(1.73 + 5223.69 * Tau);

  const B = (B0 + B1 * Tau) / 1e8 / (Math.PI / 180);
  let beta = norm360(-B);
  if (beta > 180) beta -= 360;

  let R0 = 100013989;
  R0 += 1670700 * cos(3.0984635 + 6283.07585 * Tau);
  R0 += 13956 * cos(3.05525 + 12566.1517 * Tau);
  R0 += 3084 * cos(5.1985 + 77713.7715 * Tau);
  R0 += 1628 * cos(1.1739 + 5753.3849 * Tau);
  R0 += 1576 * cos(2.8469 + 7860.4194 * Tau);
  R0 += 925 * cos(5.453 + 11506.77 * Tau);
  R0 += 542 * cos(4.564 + 3930.21 * Tau);
  R0 += 472 * cos(3.661 + 5884.927 * Tau);
  R0 += 346 * cos(0.964 + 5507.553 * Tau);
  R0 += 329 * cos(5.9 + 5223.694 * Tau);
  R0 += 307 * cos(0.299 + 5573.143 * Tau);
  R0 += 243 * cos(4.273 + 11790.629 * Tau);
  R0 += 212 * cos(5.847 + 1577.344 * Tau);
  R0 += 186 * cos(5.022 + 10977.079 * Tau);
  R0 += 175 * cos(3.012 + 18849.228 * Tau);
  R0 += 110 * cos(5.055 + 5486.778 * Tau);
  R0 += 98 * cos(0.89 + 6069.78 * Tau);
  R0 += 86 * cos(5.69 + 15720.84 * Tau);
  R0 += 86 * cos(1.27 + 161000.69 * Tau);
  R0 += 65 * cos(0.27 + 17260.15 * Tau);
  R0 += 63 * cos(0.92 + 529.69 * Tau);
  R0 += 57 * cos(2.01 + 83996.85 * Tau);
  R0 += 56 * cos(5.24 + 71430.7 * Tau);
  R0 += 49 * cos(3.25 + 2544.31 * Tau);
  R0 += 47 * cos(2.58 + 775.52 * Tau);
  R0 += 45 * cos(5.54 + 9437.76 * Tau);
  R0 += 43 * cos(6.01 + 6275.96 * Tau);
  R0 += 39 * cos(5.36 + 4694 * Tau);
  R0 += 38 * cos(2.39 + 8827.39 * Tau);
  R0 += 37 * cos(0.83 + 19651.05 * Tau);
  R0 += 37 * cos(4.9 + 12139.55 * Tau);
  R0 += 36 * cos(1.67 + 12036.46 * Tau);
  R0 += 35 * cos(1.84 + 2942.46 * Tau);
  R0 += 33 * cos(0.24 + 7084.9 * Tau);
  R0 += 32 * cos(0.18 + 5088.63 * Tau);
  R0 += 32 * cos(1.78 + 398.15 * Tau);
  R0 += 28 * cos(1.21 + 6286.6 * Tau);
  R0 += 28 * cos(1.9 + 6279.55 * Tau);
  R0 += 26 * cos(4.59 + 10447.39 * Tau);

  let R1 = 103019 * cos(1.10749 + 6283.07585 * Tau);
  R1 += 1721 * cos(1.0644 + 12566.1517 * Tau);
  R1 += 702 * cos(Math.PI);
  R1 += 32 * cos(1.02 + 18849.23 * Tau);
  R1 += 31 * cos(2.84 + 5507.55 * Tau);
  R1 += 25 * cos(1.32 + 5223.69 * Tau);
  R1 += 18 * cos(1.42 + 1577.34 * Tau);
  R1 += 10 * cos(5.91 + 10977.08 * Tau);
  R1 += 9 * cos(1.42 + 6275.96 * Tau);
  R1 += 9 * cos(0.27 + 5486.78 * Tau);

  let R2 = 4359 * cos(5.7846 + 6283.0758 * Tau) + 124 * cos(5.579 + 12566.152 * Tau) + 12 * cos(Math.PI) + 9 * cos(3.63 + 77713.77 * Tau) + 6 * cos(1.87 + 5573.14 * Tau) + 3 * cos(5.47 + 18849.23 * Tau);

  let R3 = 145 * cos(4.273 + 6283.076 * Tau) + 7 * cos(3.92 + 12566.15 * Tau);

  let R4 = 4 * cos(2.56 + 6283.08 * Tau);

  const R = (R0 + R1 * Tau + R2 * Tau2 + R3 * Tau3 + R4 * Tau4) / 1e8;

  const LsunPrime = norm360(Lhelioc + 180 - 1.397 * TE - 0.00031 * TE * TE);
  const betaCorrected = beta + 0.000011 * (cos(LsunPrime * (Math.PI / 180)) - sind(LsunPrime * (Math.PI / 180)));

  const lambda = norm360(LsunTrue + deltaPsi - 0.005691611 / R);

  const RA = norm360(atan2d((sind(lambda) * cosd(eps) - tand(betaCorrected) * sind(eps)), cosd(lambda)));
  const SHA = norm360(360 - RA);
  const DEC = asind(sind(betaCorrected) * cosd(eps) + cosd(betaCorrected) * sind(eps) * sind(lambda));

  const T2 = T * T;
  const T3 = T2 * T;
  const GHAAmean = norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T2 - T3 / 38710000);
  const GHAAtrue = norm360(GHAAmean + deltaPsi * cosd(eps));
  const GHA = norm360(GHAAtrue - RA);

  const SD = 959.63 / R;
  const HP = 8.794 / R;

  const dayfraction = (jd + 0.5) % 1;
  let EOT = 4 * GHA + 720 - 1440 * dayfraction;
  if (EOT > 20) EOT -= 1440;
  if (EOT < -20) EOT += 1440;

  return { RA, DEC, GHA, SHA, SD, HP, EOT, distance: R, lambdaApp: lambda };
}
