import { acosd, asind, atan2d, cosd, norm360, sind, tand } from '../internal/math.js';
import { getJulianDate, getDeltaT } from '../internal/time.js';
import { calculateNutation } from '../internal/nutation.js';
import { calculateSolar, SolarResult } from '../internal/solar.js';

export interface MoonEphemeris {
  RA: number;
  DEC: number;
  GHA: number;
  HP: number;
  SD: number;
  illumination: number; // 0 to 1
  L: number;           // Geocentric longitude
  B: number;           // Geocentric latitude
  distance: number;    // Earth-Moon distance in km
}

/**
 * High-precision Lunar Ephemeris using periodic series.
 * Ported from Henning Umland's sun_moon.py with IAU 1980 / ELP2000 coefficients.
 */
export function calculateMoonEphemeris(jd: number, deltaT: number): MoonEphemeris {
  const T = (jd - 2451545.0) / 36525.0;
  const TE = T + deltaT / (36525.0 * 86400.0);
  const TE2 = TE * TE;
  const TE3 = TE2 * TE;
  const TE4 = TE3 * TE;

  // Mean arguments (in degrees) with IAU 1980 / ELP2000 higher-order terms
  const Ldash = norm360(218.3164591 + 481267.88134236 * TE - 0.0013268 * TE2 + TE3 / 538841 - TE4 / 65194000);
  const D = norm360(297.8502042 + 445267.1115168 * TE - 0.00163 * TE2 + TE3 / 545868 - TE4 / 113065000);
  const M = norm360(357.5291092 + 35999.0502909 * TE - 0.0001536 * TE2 + TE3 / 24490000);
  const Mdash = norm360(134.9634114 + 477198.8676313 * TE + 0.008997 * TE2 + TE3 / 69699 - TE4 / 14712000);
  const F = norm360(93.2720993 + 483202.0175273 * TE - 0.0034029 * TE2 - TE3 / 3526000 + TE4 / 863310000);

  const E = 1 - 0.002516 * TE - 0.0000074 * TE2;

  // Periodic Terms for Longitude (sumL) and Distance (sumR)
  const cfD = [0,2,2,0,0,0,2,2,2,2,0,1,0,2,0,0,4,0,4,2,2,1,1,2,2,4,2,0,2,2,1,2,0,0,2,2,2,4,0,3,2,4,0,2,2,2,4,0,4,1,2,0,1,3,4,2,0,1,2,2];
  const cfM = [0,0,0,0,1,0,0,-1,0,-1,1,0,1,0,0,0,0,0,0,1,1,0,1,-1,0,0,0,1,0,-1,0,-2,1,2,-2,0,0,-1,0,0,1,-1,2,2,1,-1,0,0,-1,0,1,0,1,0,0,-1,2,1,0,0];
  const cfMdash = [1,-1,0,2,0,0,-2,-1,1,0,-1,0,1,0,1,1,-1,3,-2,-1,0,-1,0,1,2,0,-3,-2,-1,-2,1,0,2,0,-1,1,0,-1,2,-1,1,-2,-1,-1,-2,0,1,4,0,-2,0,2,1,-2,-3,2,1,-1,3,-1];
  const cfF = [0,0,0,0,0,2,0,0,0,0,0,0,0,-2,2,-2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,-2,2,0,2,0,0,0,0,0,0,-2,0,0,0,0,-2,-2,0,0,0,0,0,0,0,-2];
  
  const cfSineL = [6288774,1274027,658314,213618,-185116,-114332,58793,57066,53322,45758,-40923,-34720,-30383,15327,-12528,10980,10675,10034,8548,-7888,-6766,-5163,4987,4036,3994,3861,3665,-2689,-2602,2390,-2348,2236,-2120,-2069,2048,-1773,-1595,1215,-1110,-892,-810,759,-713,-700,691,596,549,537,520,-487,-399,-381,351,-340,330,327,-323,299,294,0];
  const cfCosR = [-20905355,-3699111,-2955968,-569925,48888,-3149,246158,-152138,-170733,-204586,-129620,108743,104755,10321,0,79661,-34782,-23210,-21636,24208,30824,-8379,-16675,-12831,-10445,-11650,14403,-7003,0,10056,6322,-9884,5751,0,-4950,4130,0,-3958,0,3258,2616,-1897,-2117,2354,0,0,-1423,-1117,-1571,-1739,0,-4421,0,0,0,0,1165,0,0,8752];
  
  let sumL = 0;
  let sumR = 0;

  for (let i = 0; i < 60; i++) {
    const angle = cfD[i] * D + cfM[i] * M + cfMdash[i] * Mdash + cfF[i] * F;
    let termL = cfSineL[i] * sind(angle);
    let termR = cfCosR[i] * cosd(angle);

    if (Math.abs(cfM[i]) === 1) {
      termL *= E;
      termR *= E;
    } else if (Math.abs(cfM[i]) === 2) {
      termL *= (E * E);
      termR *= (E * E);
    }
    sumL += termL;
    sumR += termR;
  }

  // Additives for Longitude
  const A1 = norm360(119.75 + 131.849 * TE);
  const A2 = norm360(53.09 + 479264.29 * TE);
  sumL += 3958 * sind(A1) + 1962 * sind(Ldash - F) + 318 * sind(A2);

  const lambdaMoon = norm360(Ldash + sumL / 1000000);
  const deltaMoon = 385000.56 + sumR / 1000;

  // Periodic Terms for Latitude (sumB)
  const cfD_B = [0,0,0,2,2,2,2,0,2,0,2,2,2,2,2,2,2,0,4,0,0,0,1,0,0,0,1,0,4,4,0,4,2,2,2,2,0,2,2,2,2,4,2,2,0,2,1,1,0,2,1,2,0,4,4,1,4,1,4,2];
  const cfM_B = [0,0,0,0,0,0,0,0,0,0,-1,0,0,1,-1,-1,-1,1,0,1,0,1,0,1,1,1,0,0,0,0,0,0,0,0,-1,0,0,0,0,1,1,0,-1,-2,0,1,1,1,1,1,0,-1,1,0,-1,0,0,0,-1,-2];
  const cfMdash_B = [0,1,1,0,-1,-1,0,2,1,2,0,-2,1,0,-1,0,-1,-1,-1,0,0,-1,0,1,1,0,0,3,0,-1,1,-2,0,2,1,-2,3,2,-3,-1,0,0,1,0,1,1,0,0,-2,-1,1,-2,2,-2,-1,1,1,-1,0,0];
  const cfF_B = [1,1,-1,-1,1,-1,1,1,-1,-1,-1,-1,1,-1,1,1,-1,-1,-1,1,3,1,1,1,-1,-1,-1,1,-1,1,-3,1,-3,-1,-1,1,-1,1,-1,1,1,1,1,-1,3,-1,-1,1,-1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,1];
  const cfSineB = [5128122,280602,277693,173237,55413,46271,32573,17198,9266,8822,8216,4324,4200,-3359,2463,2211,2065,-1870,1828,-1794,-1749,-1565,-1491,-1475,-1410,-1344,-1335,1107,1021,833,777,671,607,596,491,-451,439,422,421,-366,-351,331,315,302,-283,-229,223,223,-220,-220,-185,181,-177,176,166,-164,132,-119,115,107];

  let sumB = 0;
  for (let i = 0; i < 60; i++) {
    const angle = cfD_B[i] * D + cfM_B[i] * M + cfMdash_B[i] * Mdash + cfF_B[i] * F;
    let termB = cfSineB[i] * sind(angle);
    if (Math.abs(cfM_B[i]) === 1) {
      termB *= E;
    } else if (Math.abs(cfM_B[i]) === 2) {
      termB *= (E * E);
    }
    sumB += termB;
  }
  const A3 = norm360(313.45 + 481266.484 * TE);
  sumB += -2235 * sind(Ldash) + 382 * sind(A3) + 175 * sind(A1 - F) + 175 * sind(A1 + F) + 127 * sind(Ldash - Mdash) - 115 * sind(Ldash + Mdash);
  const betaMoon = sumB / 1000000;

  // Nutation & Obliquity
  const nut = calculateNutation(TE);
  const eps = nut.eps;
  const deltaPsi = nut.deltaPsi;

  const lambdaApparent = lambdaMoon + deltaPsi;

  // Equatorial Coordinates
  const RAMoon = norm360(atan2d(sind(lambdaApparent) * cosd(eps) - tand(betaMoon) * sind(eps), cosd(lambdaApparent)));
  const DecMoon = asind(sind(betaMoon) * cosd(eps) + cosd(betaMoon) * sind(eps) * sind(lambdaApparent));

  // Sidereal Time & GHA
  const GMST = norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + T * T * (0.000387933 - T / 38710000));
  const GAST = norm360(GMST + deltaPsi * cosd(eps));
  const GHAMoon = norm360(GAST - RAMoon);

  // HP and SD (in degrees)
  const HP = asind(6378.14 / deltaMoon);
  const SD = asind(1738.0 / deltaMoon);

  // Illumination
  const Tau = 0.1 * TE;
  const sun = calculateSolar(jd, deltaPsi, eps, TE, Tau, T);
  
  const psi = acosd(sind(sun.DEC) * sind(DecMoon) + cosd(sun.DEC) * cosd(DecMoon) * cosd(sun.RA - RAMoon));
  const deltaSun = 1.496e8 * sun.distance;
  const i = atan2d(deltaSun * sind(psi), (deltaMoon - deltaSun * cosd(psi)));
  const k = (1 + cosd(i)) / 2;

  return {
    RA: RAMoon,
    DEC: DecMoon,
    GHA: GHAMoon,
    HP: HP,
    SD: SD,
    illumination: k,
    L: lambdaMoon,
    B: betaMoon,
    distance: deltaMoon
  };
}

/**
 * Calculates the change of altitude of the Moon in degrees per hour.
 * Used for iterative solvers.
 */
export function calculateMoonSlope(jd: number, UT: number, deltaT: number, lat: number, lon: number): number {
  const UTlow = UT - 0.005;
  const UThi = UT + 0.005;

  const jdMidnight = Math.floor(jd - 0.5) + 0.5;

  const m1 = calculateMoonEphemeris(jdMidnight + UTlow / 24.0, deltaT);
  const m2 = calculateMoonEphemeris(jdMidnight + UThi / 24.0, deltaT);

  const h1 = calculateMoonAltitude(m1.GHA, m1.DEC, lat, lon);
  const h2 = calculateMoonAltitude(m2.GHA, m2.DEC, lat, lon);

  return (h2 - h1) / 0.01;
}

export function calculateMoonAltitude(gha: number, dec: number, lat: number, lon: number): number {
  const t = norm360(gha + lon);
  const tAdj = t > 180 ? t - 360 : t;
  const h = asind(sind(lat) * sind(dec) + cosd(lat) * cosd(dec) * cosd(tAdj));
  return h;
}

export function calculateMoonAzimuth(gha: number, dec: number, lat: number, lon: number): number {
  const t = norm360(gha + lon);
  const tAdj = t > 180 ? t - 360 : t;
  const az = atan2d(sind(tAdj), sind(lat) * cosd(tAdj) - cosd(lat) * tand(dec)) + 180;
  return norm360(az);
}
