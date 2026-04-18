var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/core/math.ts
var DTR = Math.PI / 180;
var RTD = 180 / Math.PI;
function sind(x) {
  return Math.sin(DTR * x);
}
function cosd(x) {
  return Math.cos(DTR * x);
}
function tand(x) {
  return Math.tan(DTR * x);
}
function asind(x) {
  return Math.asin(x) * RTD;
}
function acosd(x) {
  return Math.acos(x) * RTD;
}
function atan2d(y, x) {
  return Math.atan2(y, x) * RTD;
}
function norm360(x) {
  let res = x % 360;
  if (res < 0) res += 360;
  return res;
}
function norm24(x) {
  let res = x % 24;
  if (res < 0) res += 24;
  return res;
}

// src/core/time.ts
function getJulianDate(date) {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const dayFraction = (hour + minute / 60 + (second + ms / 1e3) / 3600) / 24;
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5 + dayFraction;
}
function getJulianCenturies(jd) {
  return (jd - 2451545) / 36525;
}
function getJulianMillennia(jc) {
  return 0.1 * jc;
}
function getDeltaT(year) {
  if (year < -500) {
    const u2 = (year - 1820) / 100;
    return -20 + 32 * u2 * u2;
  }
  if (year < 500) {
    const u2 = year / 100;
    return 10583.6 - 1014.41 * u2 + 33.7831 * u2 * u2 - 5.95205 * u2 * u2 * u2 - 0.179848 * u2 ** 4 + 0.0221741 * u2 ** 5 + 903165e-8 * u2 ** 6;
  }
  if (year < 1600) {
    const u2 = (year - 1e3) / 100;
    return 1570 - 157.42 * u2 - 51.5205 * u2 * u2 + 17.5101 * u2 * u2 * u2 - 0.720364 * u2 ** 4 + 0.01633 * u2 ** 5 - 0.113063 * u2 ** 6;
  }
  if (year < 1700) {
    const t = year - 1600;
    return 120 - 0.9808 * t - 0.01532 * t * t + t * t * t / 7129;
  }
  if (year < 1800) {
    const t = year - 1700;
    return 8.83 + 0.1603 * t - 59285e-7 * t * t + 13336e-8 * t * t * t - t ** 4 / 1174e3;
  }
  if (year < 1860) {
    const t = year - 1800;
    return 13.72 - 0.332447 * t + 68612e-7 * t * t + 41116e-7 * t * t * t - t ** 4 / 1022e3 + t ** 5 / 2616e4 - t ** 6 / 2e8;
  }
  if (year < 1900) {
    const t = year - 1860;
    return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.0168066 * t * t * t - t ** 4 / 328e3 + t ** 5 / 212e5;
  }
  if (year < 1920) {
    const t = year - 1900;
    return -2.73 + 0.1218 * t - 0.034114 * t * t + 398787e-8 * t * t * t;
  }
  if (year < 1941) {
    const t = year - 1920;
    return 21.2 + 0.84493 * t - 0.0761 * t * t + 20936e-7 * t * t * t;
  }
  if (year < 1961) {
    const t = year - 1950;
    return 29.07 + 0.407 * t - t * t / 233 + t * t * t / 2547;
  }
  if (year < 1986) {
    const t = year - 1975;
    return 45.45 + 1.067 * t - t * t / 260 - t * t * t / 718;
  }
  if (year < 2005) {
    const t = year - 2e3;
    return 63.86 + 0.3345 * t - 0.060374 * t * t + 17275e-7 * t * t * t + 653935e-9 * t ** 4 + 237359e-10 * t ** 5;
  }
  if (year < 2050) {
    const t = year - 2e3;
    return 62.92 + 0.32217 * t + 5589e-6 * t * t;
  }
  if (year < 2150) {
    return -20 + 32 * ((year - 1820) / 100) ** 2 - 0.5628 * (2150 - year);
  }
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u;
}

// src/astronomy/index.ts
var astronomy_exports = {};
__export(astronomy_exports, {
  Astronomy: () => Astronomy
});

// src/algorithms/nutation.ts
var RAW_NUT_DATA = [
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
function calculateNutation(TE) {
  const TE2 = TE * TE;
  const TE3 = TE2 * TE;
  let localMm = 134.962981389 + 198.867398056 * TE + norm360(477e3 * TE) + 0.008697222222 * TE2 + TE3 / 56250;
  let localM = 357.527723333 + 359.05034 * TE + norm360(35640 * TE) - 1602777778e-13 * TE2 - TE3 / 3e5;
  let localF = 93.271910277 + 82.017538055 * TE + norm360(483120 * TE) - 36825e-7 * TE2 + TE3 / 327272.7273;
  let localD = 297.850363055 + 307.11148 * TE + norm360(444960 * TE) - 0.001914166667 * TE2 + TE3 / 189473.6842;
  let localOmega = 125.044522222 - 134.136260833 * TE - norm360(1800 * TE) + 0.002070833333 * TE2 + TE3 / 45e4;
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
  const deltaPsi = dp / 36e6;
  const deltaEps = de / 36e6;
  const eps0 = (84381.448 - 46.815 * TE - 59e-5 * TE2 + 1813e-6 * TE3) / 3600;
  const eps = eps0 + deltaEps;
  return { deltaPsi, deltaEps, eps0, eps };
}

// src/algorithms/solar.ts
function calculateSolar(jd, deltaPsi, eps, TE, Tau, T) {
  const { cos, sin, atan2, asin } = Math;
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
  L1 += 12 * cos(2.08 + 4694 * Tau);
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
  let L3 = 289 * cos(5.844 + 6283.076 * Tau);
  L3 += 35;
  L3 += 17 * cos(5.49 + 12566.15 * Tau);
  L3 += 3 * cos(5.2 + 155.42 * Tau);
  L3 += 1 * cos(4.72 + 3.52 * Tau);
  L3 += 1 * cos(5.3 + 18849.23 * Tau);
  L3 += 1 * cos(5.97 + 242.73 * Tau);
  let L4 = 114 * cos(3.142);
  L4 += 8 * cos(4.13 + 6283.08 * Tau);
  L4 += 1 * cos(3.84 + 12566.15 * Tau);
  let L5 = 1 * cos(3.14 + 0 * Tau);
  const Tau2 = Tau * Tau;
  const Tau3 = Tau2 * Tau;
  const Tau4 = Tau3 * Tau;
  const Tau5 = Tau4 * Tau;
  const Lhelioc = norm360((L0 + L1 * Tau + L2 * Tau2 + L3 * Tau3 + L4 * Tau4 + L5 * Tau5) / 1e8 / (Math.PI / 180));
  const LsunTrue = norm360(Lhelioc + 180 - 25e-6);
  let B0 = 280 * cos(3.199 + 84334.662 * Tau);
  B0 += 102 * cos(5.422 + 5507.553 * Tau);
  B0 += 80 * cos(3.88 + 5223.69 * Tau);
  B0 += 44 * cos(3.7 + 2352.87 * Tau);
  B0 += 32 * cos(4 + 1577.34 * Tau);
  let B1 = 9 * cos(3.9 + 5507.55 * Tau);
  B1 += 6 * cos(1.73 + 5223.69 * Tau);
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
  R1 += 702 * cos(3.142);
  R1 += 32 * cos(1.02 + 18849.23 * Tau);
  R1 += 31 * cos(2.84 + 5507.55 * Tau);
  R1 += 25 * cos(1.32 + 5223.69 * Tau);
  R1 += 18 * cos(1.42 + 1577.34 * Tau);
  R1 += 10 * cos(5.91 + 10977.08 * Tau);
  R1 += 9 * cos(1.42 + 6275.96 * Tau);
  R1 += 9 * cos(0.27 + 5486.78 * Tau);
  let R2 = 4359 * cos(5.7846 + 6283.0758 * Tau);
  R2 += 124 * cos(5.579 + 12566.152 * Tau);
  R2 += 12 * cos(3.14);
  R2 += 9 * cos(3.63 + 77713.77 * Tau);
  R2 += 6 * cos(1.87 + 5573.14 * Tau);
  R2 += 3 * cos(5.47 + 18849.23 * Tau);
  let R3 = 145 * cos(4.273 + 6283.076 * Tau);
  R3 += 7 * cos(3.92 + 12566.15 * Tau);
  let R4 = 4 * cos(2.56 + 6283.08 * Tau);
  const R = (R0 + R1 * Tau + R2 * Tau2 + R3 * Tau3 + R4 * Tau4) / 1e8;
  const TE2 = TE * TE;
  const LsunPrime = norm360(Lhelioc + 180 - 1.397 * TE - 31e-5 * TE2);
  const betaCorrected = beta + 11e-6 * (cosd(LsunPrime) - sind(LsunPrime));
  const lambda = norm360(LsunTrue + deltaPsi - 5691611e-9 / R);
  const RA = norm360(atan2d(sind(lambda) * cosd(eps) - tand(betaCorrected) * sind(eps), cosd(lambda)));
  const SHA = norm360(360 - RA);
  const DEC = asind(sind(betaCorrected) * cosd(eps) + cosd(betaCorrected) * sind(eps) * sind(lambda));
  const T2 = T * T;
  const T3 = T2 * T;
  const GHAAmean = norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + 387933e-9 * T2 - T3 / 3871e4);
  const GHAAtrue = norm360(GHAAmean + deltaPsi * cosd(eps));
  const GHA = norm360(GHAAtrue - RA);
  const SD = 959.63 / R;
  const HP = 8.794 / R;
  const dayfraction = (jd + 0.5) % 1;
  let EOT = 4 * GHA + 720 - 1440 * dayfraction;
  if (EOT > 20) EOT -= 1440;
  if (EOT < -20) EOT += 1440;
  return { RA, DEC, GHA, SHA, SD, HP, EOT, distance: R };
}

// src/algorithms/moon.ts
function calculateMoon(jd, TE, deltaPsi, eps, GHAAtrue, sunLambda, sunRA, sunDec) {
  const { abs, round, sin, cos, atan2, asin, floor } = Math;
  const Lmoon_mean = norm360(218.3164591 + 481267.88134236 * TE - 13268e-7 * TE ** 2 + TE ** 3 / 538841 - TE ** 4 / 65194e3);
  const D = norm360(297.8502042 + 445267.1115168 * TE - 163e-5 * TE ** 2 + TE ** 3 / 545868 - TE ** 4 / 113065e3);
  const Msun_mean = norm360(357.5291092 + 35999.0502909 * TE - 1536e-7 * TE ** 2 + TE ** 3 / 2449e4);
  const Mmoon_mean = norm360(134.9634114 + 477198.8676313 * TE + 8997e-6 * TE ** 2 + TE ** 3 / 69699 - TE ** 4 / 14712e3);
  const F = norm360(93.2720993 + 483202.0175273 * TE - 34029e-7 * TE ** 2 - TE ** 3 / 3526e3 + TE ** 4 / 86331e4);
  let A1 = norm360(119.75 + 131.849 * TE);
  let A2 = norm360(53.09 + 479264.29 * TE);
  let A3 = norm360(313.45 + 481266.484 * TE);
  const fE = 1 - 2516e-6 * TE - 74e-7 * TE ** 2;
  const fE2 = fE * fE;
  const terms = [
    { d: 0, ms: 0, mm: 1, f: 0, s: 6288774, c: -20905355 },
    { d: 2, ms: 0, mm: -1, f: 0, s: 1274027, c: -3699111 },
    { d: 2, ms: 0, mm: 0, f: 0, s: 658314, c: -2955968 },
    { d: 0, ms: 0, mm: 2, f: 0, s: 213618, c: -569925 },
    { d: 0, ms: 1, mm: 0, f: 0, s: -185116, c: 48888 },
    { d: 0, ms: 0, mm: 0, f: 2, s: -114332, c: -3149 },
    { d: 2, ms: 0, mm: -2, f: 0, s: 58793, c: 246158 },
    { d: 2, ms: -1, mm: -1, f: 0, s: 57066, c: -152138 },
    { d: 2, ms: 0, mm: 1, f: 0, s: 53322, c: -170733 },
    { d: 2, ms: -1, mm: 0, f: 0, s: 45758, c: -204586 },
    { d: 0, ms: 1, mm: -1, f: 0, s: -40923, c: -129620 },
    { d: 1, ms: 0, mm: 0, f: 0, s: -34720, c: 108743 },
    { d: 0, ms: 1, mm: 1, f: 0, s: -30383, c: 104755 },
    { d: 2, ms: 0, mm: 0, f: -2, s: 15327, c: 10321 },
    { d: 0, ms: 0, mm: 1, f: 2, s: -12528, c: 0 },
    { d: 0, ms: 0, mm: 1, f: -2, s: 10980, c: 79661 },
    { d: 4, ms: 0, mm: -1, f: 0, s: 10675, c: -34782 },
    { d: 0, ms: 0, mm: 3, f: 0, s: 10034, c: -23210 },
    { d: 4, ms: 0, mm: -2, f: 0, s: 8548, c: -21636 },
    { d: 2, ms: 1, mm: -1, f: 0, s: -7888, c: 24208 },
    { d: 2, ms: 1, mm: 0, f: 0, s: -6766, c: 30824 },
    { d: 1, ms: 0, mm: -1, f: 0, s: -5163, c: -8379 },
    { d: 1, ms: 1, mm: 0, f: 0, s: 4987, c: -16675 },
    { d: 2, ms: -1, mm: 1, f: 0, s: 4036, c: -12831 },
    { d: 2, ms: 0, mm: 2, f: 0, s: 3994, c: -10445 },
    { d: 4, ms: 0, mm: 0, f: 0, s: 3861, c: -11650 },
    { d: 2, ms: 0, mm: -3, f: 0, s: 3665, c: 14403 },
    { d: 0, ms: 1, mm: -2, f: 0, s: -2689, c: -7003 },
    { d: 2, ms: 0, mm: -1, f: 2, s: -2602, c: 0 },
    { d: 2, ms: -1, mm: -2, f: 0, s: 2390, c: 10056 },
    { d: 1, ms: 0, mm: 1, f: 0, s: -2348, c: 6322 },
    { d: 2, ms: -2, mm: 0, f: 0, s: 2236, c: -9884 },
    { d: 0, ms: 1, mm: 2, f: 0, s: -2120, c: 5751 },
    { d: 0, ms: 2, mm: 0, f: 0, s: -2069, c: 0 },
    { d: 2, ms: -2, mm: -1, f: 0, s: 2048, c: -4950 },
    { d: 2, ms: 0, mm: 1, f: -2, s: -1773, c: 4130 },
    { d: 2, ms: 0, mm: 0, f: 2, s: -1595, c: 0 },
    { d: 4, ms: -1, mm: -1, f: 0, s: 1215, c: -3958 },
    { d: 0, ms: 0, mm: 2, f: 2, s: -1110, c: 0 },
    { d: 3, ms: 0, mm: -1, f: 0, s: -892, c: 3258 },
    { d: 2, ms: 1, mm: 1, f: 0, s: -810, c: 2616 },
    { d: 4, ms: -1, mm: -2, f: 0, s: 759, c: -1897 },
    { d: 0, ms: 2, mm: -1, f: 0, s: -713, c: -2117 },
    { d: 2, ms: 2, mm: -1, f: 0, s: -700, c: 2354 },
    { d: 2, ms: 1, mm: -2, f: 0, s: 691, c: 0 },
    { d: 2, ms: -1, mm: 0, f: -2, s: 596, c: 0 },
    { d: 4, ms: 0, mm: 1, f: 0, s: 549, c: -1423 },
    { d: 0, ms: 0, mm: 4, f: 0, s: 537, c: -1117 },
    { d: 4, ms: -1, mm: 0, f: 0, s: 520, c: -1571 },
    { d: 1, ms: 0, mm: -2, f: 0, s: -487, c: -1739 },
    { d: 2, ms: 1, mm: 0, f: -2, s: -399, c: 0 },
    { d: 0, ms: 0, mm: 2, f: -2, s: -381, c: -4421 },
    { d: 1, ms: 1, mm: 1, f: 0, s: 351, c: 0 },
    { d: 3, ms: 0, mm: -2, f: 0, s: -340, c: 0 },
    { d: 4, ms: 0, mm: -3, f: 0, s: 330, c: 0 },
    { d: 2, ms: -1, mm: 2, f: 0, s: 327, c: 0 },
    { d: 0, ms: 2, mm: 1, f: 0, s: -323, c: 1165 },
    { d: 1, ms: 1, mm: -1, f: 0, s: 299, c: 0 },
    { d: 2, ms: 0, mm: 3, f: 0, s: 294, c: 0 },
    { d: 2, ms: 0, mm: -1, f: -2, s: 0, c: 8752 }
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
  const latTerms = [
    { d: 0, ms: 0, mm: 0, f: 1, s: 5128122 },
    { d: 0, ms: 0, mm: 1, f: 1, s: 280602 },
    { d: 0, ms: 0, mm: 1, f: -1, s: 277693 },
    { d: 2, ms: 0, mm: 0, f: -1, s: 173237 },
    { d: 2, ms: 0, mm: -1, f: 1, s: 55413 },
    { d: 2, ms: 0, mm: -1, f: -1, s: 46271 },
    { d: 2, ms: 0, mm: 0, f: 1, s: 32573 },
    { d: 0, ms: 0, mm: 2, f: 1, s: 17198 },
    { d: 2, ms: 0, mm: 1, f: -1, s: 9266 },
    { d: 0, ms: 0, mm: 2, f: -1, s: 8822 },
    { d: 2, ms: -1, mm: 0, f: -1, s: 8216 },
    { d: 2, ms: 0, mm: -2, f: -1, s: 4324 },
    { d: 2, ms: 0, mm: 1, f: 1, s: 4200 },
    { d: 2, ms: 1, mm: 0, f: -1, s: -3359 },
    { d: 2, ms: -1, mm: -1, f: 1, s: 2463 },
    { d: 2, ms: -1, mm: 0, f: 1, s: 2211 },
    { d: 2, ms: -1, mm: -1, f: -1, s: 2065 },
    { d: 0, ms: 1, mm: -1, f: -1, s: -1870 },
    { d: 4, ms: 0, mm: -1, f: -1, s: 1828 },
    { d: 0, ms: 1, mm: 0, f: 1, s: -1794 },
    { d: 0, ms: 0, mm: 0, f: 3, s: -1749 },
    { d: 0, ms: 1, mm: -1, f: 1, s: -1565 },
    { d: 1, ms: 0, mm: 0, f: 1, s: -1491 },
    { d: 0, ms: 1, mm: 1, f: 1, s: -1475 },
    { d: 0, ms: 1, mm: 1, f: -1, s: -1410 },
    { d: 0, ms: 1, mm: 0, f: -1, s: -1344 },
    { d: 1, ms: 0, mm: 0, f: -1, s: -1335 },
    { d: 0, ms: 0, mm: 3, f: 1, s: 1107 },
    { d: 4, ms: 0, mm: 0, f: -1, s: 1021 },
    { d: 4, ms: 0, mm: -1, f: 1, s: 833 },
    { d: 0, ms: 0, mm: 1, f: -3, s: 777 },
    { d: 4, ms: 0, mm: -2, f: 1, s: 671 },
    { d: 2, ms: 0, mm: 0, f: -3, s: 607 },
    { d: 2, ms: 0, mm: 2, f: -1, s: 596 },
    { d: 2, ms: -1, mm: 1, f: -1, s: 491 },
    { d: 2, ms: 0, mm: -2, f: 1, s: -451 },
    { d: 0, ms: 0, mm: 3, f: -1, s: 439 },
    { d: 2, ms: 0, mm: 2, f: 1, s: 422 },
    { d: 2, ms: 0, mm: -3, f: -1, s: 421 },
    { d: 2, ms: 1, mm: -1, f: 1, s: -366 },
    { d: 2, ms: 1, mm: 0, f: 1, s: -351 },
    { d: 4, ms: 0, mm: 0, f: 1, s: 331 },
    { d: 2, ms: -1, mm: 1, f: 1, s: 315 },
    { d: 2, ms: -2, mm: 0, f: -1, s: 302 },
    { d: 0, ms: 0, mm: 1, f: 3, s: -283 },
    { d: 2, ms: 1, mm: 1, f: -1, s: -229 },
    { d: 1, ms: 1, mm: 0, f: -1, s: 223 },
    { d: 1, ms: 1, mm: 0, f: 1, s: 223 },
    { d: 0, ms: 1, mm: -2, f: -1, s: -220 },
    { d: 2, ms: 1, mm: -1, f: -1, s: -220 },
    { d: 1, ms: 0, mm: 1, f: 1, s: -185 },
    { d: 2, ms: -1, mm: -2, f: -1, s: 181 },
    { d: 0, ms: 1, mm: 2, f: 1, s: -177 },
    { d: 4, ms: 0, mm: -2, f: -1, s: 176 },
    { d: 4, ms: -1, mm: -1, f: -1, s: 166 },
    { d: 1, ms: 0, mm: 1, f: -1, s: -164 },
    { d: 4, ms: 0, mm: 1, f: -1, s: 132 },
    { d: 1, ms: 0, mm: -1, f: -1, s: -119 },
    { d: 4, ms: -1, mm: 0, f: -1, s: 115 },
    { d: 2, ms: -2, mm: 0, f: 1, s: 107 }
  ];
  let sumB = 0;
  for (const term of latTerms) {
    let f = 1;
    if (abs(term.ms) === 1) f = fE;
    if (abs(term.ms) === 2) f = fE2;
    const arg = term.d * D + term.ms * Msun_mean + term.mm * Mmoon_mean + term.f * F;
    sumB += f * term.s * sind(arg);
  }
  sumL = sumL + 3958 * sind(A1) + 1962 * sind(Lmoon_mean - F) + 318 * sind(A2);
  sumB = sumB - 2235 * sind(Lmoon_mean) + 382 * sind(A3) + 175 * sind(A1 - F) + 175 * sind(A1 + F) + 127 * sind(Lmoon_mean - Mmoon_mean) - 115 * sind(Lmoon_mean + Mmoon_mean);
  const lambdaM = norm360(Lmoon_mean + sumL / 1e6);
  const betaM = sumB / 1e6;
  const dEM = 385000.56 + sumR / 1e3;
  const lambdaMapp = lambdaM + deltaPsi;
  const RA = norm360(atan2d(sind(lambdaMapp) * cosd(eps) - tand(betaM) * sind(eps), cosd(lambdaMapp)));
  const SHA = norm360(360 - RA);
  const DEC = asind(sind(betaM) * cosd(eps) + cosd(betaM) * sind(eps) * sind(lambdaMapp));
  const GHA = norm360(GHAAtrue - RA);
  const HP = 3600 * asind(6378.14 / dEM);
  const SD = 3600 * asind(1738 / dEM);
  let phaseAngle = lambdaMapp - sunLambda;
  const illumination = 100 * (1 - cosd(phaseAngle)) / 2;
  const xMoon = norm360(phaseAngle);
  const isWaxing = xMoon > 0 && xMoon < 180;
  return {
    RA,
    DEC,
    GHA,
    SHA,
    SD,
    HP,
    illumination: round(10 * illumination) / 10,
    isWaxing,
    distance: dEM
  };
}

// src/algorithms/polaris.ts
function calculatePolaris(TE, GHAAtrue, eps, deltaPsi, sunLambda) {
  const { atan2, asin, sin, cos, tan } = Math;
  const RApol0 = 37.95293333;
  const DECpol0 = 89.26408889;
  const dRApol = 2.98155 / 3600;
  const dDECpol = -0.0152 / 3600;
  const RApol1 = RApol0 + 100 * TE * dRApol;
  const DECpol1 = DECpol0 + 100 * TE * dDECpol;
  const eps0_2000 = 23.439291111;
  const lambdapol1 = atan2d(sind(RApol1) * cosd(eps0_2000) + tand(DECpol1) * sind(eps0_2000), cosd(RApol1));
  const betapol1 = asind(sind(DECpol1) * cosd(eps0_2000) - cosd(DECpol1) * sind(eps0_2000) * sind(RApol1));
  const eta = (47.0029 * TE - 0.03302 * TE ** 2 + 6e-5 * TE ** 3) / 3600 * (Math.PI / 180);
  const PI0 = (174.876384 - (869.8089 * TE + 0.03536 * TE ** 2) / 3600) * (Math.PI / 180);
  const p0 = (5029.0966 * TE + 1.11113 * TE ** 2 - 6e-7 * TE ** 3) / 3600 * (Math.PI / 180);
  const A1 = cos(eta) * cosd(betapol1) * sin(PI0 - lambdapol1 * (Math.PI / 180)) - sin(eta) * sind(betapol1);
  const B1 = cosd(betapol1) * cos(PI0 - lambdapol1 * (Math.PI / 180));
  const C1 = cos(eta) * sind(betapol1) + sin(eta) * cosd(betapol1) * sin(PI0 - lambdapol1 * (Math.PI / 180));
  let lambdapol2 = (p0 + PI0 - atan2(A1, B1)) / (Math.PI / 180);
  let betapol2 = asin(C1) / (Math.PI / 180);
  lambdapol2 += deltaPsi;
  const kappa = 20.49552 / 3600;
  const pi0 = 102.93735 + 1.71953 * TE + 46e-5 * TE ** 2;
  const e = 0.016708617 - 42037e-9 * TE - 1236e-10 * TE ** 2;
  const dlambdapol = (e * kappa * cosd(pi0 - lambdapol2) - kappa * cosd(sunLambda - lambdapol2)) / cosd(betapol2);
  const dbetapol = -kappa * sind(betapol2) * (sind(sunLambda - lambdapol2) - e * sind(pi0 - lambdapol2));
  lambdapol2 += dlambdapol;
  betapol2 += dbetapol;
  const RApol2 = atan2d(sind(lambdapol2) * cosd(eps) - tand(betapol2) * sind(eps), cosd(lambdapol2));
  const DECpol2 = asind(sind(betapol2) * cosd(eps) + cosd(betapol2) * sind(eps) * sind(lambdapol2));
  return {
    GHA: norm360(GHAAtrue - RApol2),
    SHA: norm360(360 - RApol2),
    DEC: DECpol2
  };
}

// src/astronomy/index.ts
var Astronomy = class {
  _jd;
  _jde;
  _t;
  // JD-based centuries
  _te;
  // JDE-based centuries
  _tau;
  // JDE-based millennia
  _nutation;
  _solar;
  _moon;
  _polaris;
  constructor(date = /* @__PURE__ */ new Date(), deltaT) {
    this._jd = getJulianDate(date);
    const dt = deltaT !== void 0 ? deltaT : getDeltaT(date.getUTCFullYear());
    this._jde = this._jd + dt / 86400;
    this._t = (this._jd - 2451545) / 36525;
    this._te = (this._jde - 2451545) / 36525;
    this._tau = 0.1 * this._te;
    this._nutation = calculateNutation(this._te);
  }
  get jd() {
    return this._jd;
  }
  get jde() {
    return this._jde;
  }
  get t() {
    return this._t;
  }
  get te() {
    return this._te;
  }
  get tau() {
    return this._tau;
  }
  get nutation() {
    return this._nutation;
  }
  get sun() {
    if (!this._solar) {
      this._solar = calculateSolar(
        this._jd,
        this._nutation.deltaPsi,
        this._nutation.eps,
        this._te,
        this._tau,
        this._t
      );
    }
    return this._solar;
  }
  get moon() {
    if (!this._moon) {
      const sunResult = this.sun;
      const t2 = this._t * this._t;
      const t3 = t2 * this._t;
      const ghaaMean = (280.46061837 + 360.98564736629 * (this._jd - 2451545) + 387933e-9 * t2 - t3 / 3871e4) % 360;
      const ghaaTrue = (ghaaMean + this._nutation.deltaPsi * Math.cos(this._nutation.eps * Math.PI / 180)) % 360;
      this._moon = calculateMoon(
        this._jd,
        this._te,
        this._nutation.deltaPsi,
        this._nutation.eps,
        ghaaTrue,
        0,
        // Should use apparent longitude of sun
        sunResult.RA,
        sunResult.DEC
      );
    }
    return this._moon;
  }
  get polaris() {
    if (!this._polaris) {
      const sunResult = this.sun;
      const t2 = this._t * this._t;
      const t3 = t2 * this._t;
      const ghaaMean = (280.46061837 + 360.98564736629 * (this._jd - 2451545) + 387933e-9 * t2 - t3 / 3871e4) % 360;
      const ghaaTrue = (ghaaMean + this._nutation.deltaPsi * Math.cos(this._nutation.eps * Math.PI / 180)) % 360;
      this._polaris = calculatePolaris(
        this._te,
        ghaaTrue,
        this._nutation.eps,
        this._nutation.deltaPsi,
        0
        // sunLambda
      );
    }
    return this._polaris;
  }
};

// src/prayer/index.ts
var prayer_exports = {};
__export(prayer_exports, {
  PRESETS: () => PRESETS,
  PrayerEngine: () => PrayerEngine,
  getPrayerTimes: () => getPrayerTimes
});

// src/prayer/types.ts
var PRESETS = {
  MWL: { fajrAngle: 18, ishaAngle: 17 },
  ISNA: { fajrAngle: 15, ishaAngle: 15 },
  Egypt: { fajrAngle: 19.5, ishaAngle: 17.5 },
  Makkah: { fajrAngle: 18.5, ishaInterval: 90 },
  Karachi: { fajrAngle: 18, ishaAngle: 18 },
  Tehran: { fajrAngle: 17.7, ishaAngle: 14, maghribAngle: 4.5 },
  Jafari: { fajrAngle: 16, ishaAngle: 14, maghribAngle: 4 }
};

// src/prayer/engine.ts
var PrayerEngine = class {
  constructor(coords, method = "Karachi") {
    this.coords = coords;
    this.method = method;
  }
  coords;
  method;
  calculate(date, asrFactor = 2) {
    console.log(`--- ENGINE DEBUG: ${date.toDateString()} ---`);
    console.log(`Coords: ${this.coords.latitude}, ${this.coords.longitude}`);
    const dhuhr = this.calculateTransit(date);
    console.log(`Solar Noon (Dhuhr): ${dhuhr.toISOString()} (${dhuhr.toString()})`);
    const params = PRESETS[this.method];
    const fajr = this.solveIteratively(date, params.fajrAngle, "morning");
    console.log(`Fajr: ${isNaN(fajr.getTime()) ? "No Occurrence" : fajr.toISOString()}`);
    const sunrise = this.solvePhenomenonIteratively(date, "morning");
    console.log(`Sunrise: ${isNaN(sunrise.getTime()) ? "No Occurrence" : sunrise.toISOString()}`);
    const maghrib = params.maghribInterval ? new Date(sunrise.getTime() + params.maghribInterval * 6e4) : params.maghribAngle ? this.solveIteratively(date, params.maghribAngle, "evening") : this.solvePhenomenonIteratively(date, "evening");
    console.log(`Maghrib: ${isNaN(maghrib.getTime()) ? "No Occurrence" : maghrib.toISOString()}`);
    const isha = params.ishaInterval ? new Date(maghrib.getTime() + params.ishaInterval * 6e4) : this.solveIteratively(date, params.ishaAngle || 18, "evening");
    console.log(`Isha: ${isNaN(isha.getTime()) ? "No Occurrence" : isha.toISOString()}`);
    const asr = this.solveAsrIteratively(date, asrFactor);
    console.log(`Asr: ${isNaN(asr.getTime()) ? "No Occurrence" : asr.toISOString()}`);
    const dhahwaKubra = new Date((fajr.getTime() + maghrib.getTime()) / 2);
    console.log(`Dhahwa Kubra: ${isNaN(dhahwaKubra.getTime()) ? "No Occurrence" : dhahwaKubra.toISOString()}`);
    return {
      fajr,
      sunrise,
      dhahwaKubra,
      dhuhr,
      asr,
      maghrib,
      isha
    };
  }
  getSolarAt(date) {
    const jd = getJulianDate(date);
    const dt = 70;
    const jde = jd + dt / 86400;
    const t = (jd - 2451545) / 36525;
    const te = (jde - 2451545) / 36525;
    const tau = 0.1 * te;
    const nut = calculateNutation(te);
    const solar = calculateSolar(jd, nut.deltaPsi, nut.eps, te, tau, t);
    console.log(`[jd=${jd.toFixed(6)}] GHA=${solar.GHA.toFixed(4)}, DEC=${solar.DEC.toFixed(4)}, EOT=${solar.EOT.toFixed(4)}`);
    return { solar, jd };
  }
  calculateTransit(date) {
    let currentUtcTime = 12 - this.coords.longitude / 15;
    for (let i = 0; i < 3; i++) {
      const checkDate = this.toDate(date, currentUtcTime);
      const { solar } = this.getSolarAt(checkDate);
      currentUtcTime = 12 - this.coords.longitude / 15 - solar.EOT / 60;
    }
    return this.toDate(date, currentUtcTime);
  }
  /**
   * Successive Approximation loop for target Zenith angle.
   * Stops when refinement is < 1 second.
   */
  solveIteratively(date, angleBelowHorizon, side) {
    let prevTime = side === "morning" ? 6 : 18;
    let currentUtcTime = prevTime;
    const MAX_ITER = 5;
    for (let i = 0; i < MAX_ITER; i++) {
      const checkDate = this.toDate(date, currentUtcTime);
      const { solar } = this.getSolarAt(checkDate);
      const denominator = cosd(this.coords.latitude) * cosd(solar.DEC);
      if (Math.abs(denominator) < 1e-10) {
        return /* @__PURE__ */ new Date(NaN);
      }
      const cosH = (sind(-angleBelowHorizon) - sind(this.coords.latitude) * sind(solar.DEC)) / denominator;
      if (cosH > 1 || cosH < -1) return /* @__PURE__ */ new Date(NaN);
      const H = acosd(cosH) / 15;
      const transit = 12 - this.coords.longitude / 15 - solar.EOT / 60;
      currentUtcTime = side === "morning" ? transit - H : transit + H;
      if (Math.abs(currentUtcTime - prevTime) * 3600 < 1) break;
      prevTime = currentUtcTime;
    }
    return this.toDate(date, currentUtcTime);
  }
  /**
   * Successive Approximation for Sunrise/Maghrib.
   * Formula: 90 + 34' (Refraction) + SD - HP
   */
  solvePhenomenonIteratively(date, side) {
    let prevTime = side === "morning" ? 6 : 18;
    let currentUtcTime = prevTime;
    for (let i = 0; i < 5; i++) {
      const checkDate = this.toDate(date, currentUtcTime);
      const { solar } = this.getSolarAt(checkDate);
      const refraction = 34 / 60;
      const sd_deg = solar.SD / 3600;
      const hp_deg = solar.HP / 3600;
      const elevation = this.coords.elevation || 0;
      const dip = 0.02933333 * Math.sqrt(elevation);
      const targetZenith = 90 + refraction + sd_deg - hp_deg + dip;
      const denominator = cosd(this.coords.latitude) * cosd(solar.DEC);
      if (Math.abs(denominator) < 1e-10) {
        return /* @__PURE__ */ new Date(NaN);
      }
      const cosH = (cosd(targetZenith) - sind(this.coords.latitude) * sind(solar.DEC)) / denominator;
      if (cosH > 1 || cosH < -1) return /* @__PURE__ */ new Date(NaN);
      const H = acosd(cosH) / 15;
      const transit = 12 - this.coords.longitude / 15 - solar.EOT / 60;
      currentUtcTime = side === "morning" ? transit - H : transit + H;
      if (Math.abs(currentUtcTime - prevTime) * 3600 < 1) break;
      prevTime = currentUtcTime;
    }
    return this.toDate(date, currentUtcTime);
  }
  solveAsrIteratively(date, factor) {
    let prevTime = 15;
    let currentUtcTime = prevTime;
    for (let i = 0; i < 5; i++) {
      const checkDate = this.toDate(date, currentUtcTime);
      const { solar } = this.getSolarAt(checkDate);
      const alt = factor + tand(Math.abs(this.coords.latitude - solar.DEC));
      const h = atan2d(1, alt);
      const denominator = cosd(this.coords.latitude) * cosd(solar.DEC);
      if (Math.abs(denominator) < 1e-10) {
        return /* @__PURE__ */ new Date(NaN);
      }
      const cosH = (sind(h) - sind(this.coords.latitude) * sind(solar.DEC)) / denominator;
      if (cosH > 1 || cosH < -1) return /* @__PURE__ */ new Date(NaN);
      const H = acosd(cosH) / 15;
      const transit = 12 - this.coords.longitude / 15 - solar.EOT / 60;
      currentUtcTime = transit + H;
      if (Math.abs(currentUtcTime - prevTime) * 3600 < 1) break;
      prevTime = currentUtcTime;
    }
    return this.toDate(date, currentUtcTime);
  }
  toDate(baseDate, utcHours) {
    const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0));
    const totalSeconds = Math.round(utcHours * 3600);
    d.setUTCSeconds(totalSeconds);
    return d;
  }
};

// src/prayer/index.ts
function getPrayerTimes(arg1, arg2, arg3, arg4, arg5, arg6) {
  let config;
  if (typeof arg1 === "number") {
    config = {
      location: { latitude: arg1, longitude: arg2 || 0 },
      method: arg3 || "Karachi",
      madhab: typeof arg4 === "number" ? arg4 === 2 ? "Hanafi" : "Shafi" : arg4 || "Hanafi",
      date: arg5 || /* @__PURE__ */ new Date(),
      elevation: arg6
    };
  } else {
    config = arg1;
  }
  const {
    date = /* @__PURE__ */ new Date(),
    location,
    method = "Karachi",
    madhab = "Hanafi",
    elevation = config.location.elevation || 0,
    elevationUnit = "m"
  } = config;
  const elevationMeters = elevationUnit === "ft" ? elevation * 0.3048 : elevation;
  const engine = new PrayerEngine({ ...location, elevation: elevationMeters }, method);
  const factor = madhab === "Hanafi" ? 2 : 1;
  return engine.calculate(date, factor);
}

// src/qibla/index.ts
var qibla_exports = {};
__export(qibla_exports, {
  calculateQibla: () => calculateQibla
});
var MAKKAH_LAT = 21.4225;
var MAKKAH_LNG = 39.8262;
function calculateQibla(coords) {
  const phi = coords.latitude;
  const lambda = coords.longitude;
  const y = sind(MAKKAH_LNG - lambda);
  const x = cosd(phi) * tand(MAKKAH_LAT) - sind(phi) * cosd(MAKKAH_LNG - lambda);
  let qibla = atan2d(y, x);
  if (qibla < 0) qibla += 360;
  const dPhi = Math.log(tand(MAKKAH_LAT / 2 + 45) / tand(phi / 2 + 45));
  const dLon = (MAKKAH_LNG - lambda) * Math.PI / 180;
  let rhumb = atan2d(dLon, dPhi);
  if (rhumb < 0) rhumb += 360;
  const R = 6371;
  const dLat = (MAKKAH_LAT - phi) * Math.PI / 180;
  const dl = (MAKKAH_LNG - lambda) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(phi * Math.PI / 180) * Math.cos(MAKKAH_LAT * Math.PI / 180) * Math.sin(dl / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return {
    bearing: qibla,
    rhumbLine: rhumb,
    distance
  };
}
export {
  astronomy_exports as Astronomy,
  Astronomy as AstronomyClass,
  DTR,
  PRESETS,
  PrayerEngine,
  prayer_exports as PrayerTimes,
  qibla_exports as Qibla,
  RTD,
  acosd,
  asind,
  atan2d,
  getPrayerTimes as calculate,
  calculateQibla,
  cosd,
  getDeltaT,
  getJulianCenturies,
  getJulianDate,
  getJulianMillennia,
  getPrayerTimes,
  norm24,
  norm360,
  sind,
  tand
};
