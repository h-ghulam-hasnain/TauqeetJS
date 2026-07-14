import { acosd, asind, atand2, cosd, sind, tand } from '../../../internal/trig.js';
import { normalizeDegrees } from '../../../internal/angles.js';
import { timeArguments } from '../../time/JulianDate.js';
import { computeNutation } from '../nutation/iau2000b.js';
import { computeSolarPosition } from '../../bodies/sun/SolarPosition.js';
import { elp2000Data } from './elp2000Packed.js';
import type { LunarPositionResult } from '../../types/ephemeris.js';

const argumentPolynomialCoefficients = [
  [785939.8782, 1732559343.3328, -6.870, 0.006604, -0.00003169],
  [300071.6518, 14643420.3304, -38.2639, -0.045047, 0.00021301],
  [450160.3265, -6967919.8851, 6.3593, 0.007625, -0.00003586],
  [361679.1880, 129597742.3016, -0.0202, 0.000009, 0.00000015],
  [370574.4136, 1161.2283, 0.5327, -0.000138, 0.0]
];

const planetaryPolynomialCoefficients = [
  [908103.25986, 538101628.68898],    // Mercury
  [655127.28305, 210664136.43355],    // Venus
  [361679.22059, 129597742.2758],     // Earth
  [1279559.78866, 68905077.59284],    // Mars
  [123665.34212, 10925660.42861],     // Jupiter
  [180278.89694, 4399609.65932],      // Saturn
  [1130598.01841, 1542481.19393],     // Uranus
  [1095655.19575, 786550.32074]       // Neptune
];

const radFactor = Math.PI / 648000.0;
const poly0_1 = argumentPolynomialCoefficients[0]?.[1] ?? 1.0;
const corrections = {
  deltanu: 0.55604 * radFactor / poly0_1,
  deltaE: 0.01789 * radFactor,
  deltaGamma: -0.08066 * radFactor,
  deltanp: -0.06424 * radFactor / poly0_1,
  deltaep: -0.12879 * radFactor
};
const dtasm = 2.0 * 0.002571881335 / (3.0 * 0.074801329518);
const am = 0.074801329518;
const precessionConstant = 5029.0966 - 0.0316;

function evaluatePolynomialHorner(t: number, coeffs: number[], n: number): number {
  let result = 0.0;
  const maxDeg = Math.min(n, coeffs.length) - 1;
  for (let j = maxDeg; j >= 0; j--) {
    result = result * t + coeffs[j]!;
  }
  return result;
}

function evaluateArgumentPolynomials(t: number, n: number) {
  const elpArguments = [0.0, 0.0, 0.0, 0.0, 0.0];
  for (let i = 0; i < 5; i++) {
    const coeffs = argumentPolynomialCoefficients[i];
    if (coeffs) {
      elpArguments[i] = evaluatePolynomialHorner(t, coeffs, n);
    }
  }
  return {
    W1: elpArguments[0]!,
    W2: elpArguments[1]!,
    W3: elpArguments[2]!,
    T: elpArguments[3]!,
    OBP: elpArguments[4]!
  };
}

function evaluateDelaunayArguments(elpArguments: { W1: number; W2: number; W3: number; T: number; OBP: number }) {
  return {
    D: elpArguments.W1 - elpArguments.T + 648000.0,
    LP: elpArguments.T - elpArguments.OBP,
    L: elpArguments.W1 - elpArguments.W2,
    F: elpArguments.W1 - elpArguments.W3
  };
}

function evaluatePlanetaryArguments(t: number) {
  const planetaryArguments: number[] = [];
  for (let i = 0; i < planetaryPolynomialCoefficients.length; i++) {
    const coeffs = planetaryPolynomialCoefficients[i];
    if (coeffs) {
      planetaryArguments.push(coeffs[0]! + coeffs[1]! * t);
    }
  }
  return planetaryArguments;
}

// Layout: [i1, i2, i3, i4, A, B1, B2, B3, B4, B5, B6] (Stride = 11)
function computeMainFigureSin(delArgs: { D: number; LP: number; L: number; F: number }, data: Float64Array) {
  let sum = 0.0;
  const len = data.length / 11;
  const { D, LP, L, F } = delArgs;
  const dnp_am_dnu = corrections.deltanp - am * corrections.deltanu;
  const dGamma = corrections.deltaGamma;
  const dE = corrections.deltaE;
  const dep = corrections.deltaep;
  const factor = Math.PI / 648000.0;

  for (let r = 0; r < len; r++) {
    const offset = r * 11;
    const i1 = data[offset]!;
    const i2 = data[offset + 1]!;
    const i3 = data[offset + 2]!;
    const i4 = data[offset + 3]!;
    const A_coeff = data[offset + 4]!;
    const B1 = data[offset + 5]!;
    const B2 = data[offset + 6]!;
    const B3 = data[offset + 7]!;
    const B4 = data[offset + 8]!;
    const B5 = data[offset + 9]!;

    const A = A_coeff
      + (B1 + dtasm * B5) * dnp_am_dnu
      + B2 * dGamma
      + B3 * dE
      + B4 * dep;
    sum += A * Math.sin((i1 * D + i2 * LP + i3 * L + i4 * F) * factor);
  }
  return sum;
}

// Layout: [i1, i2, i3, i4, A, B1, B2, B3, B4, B5, B6] (Stride = 11)
function computeMainFigureCos(delArgs: { D: number; LP: number; L: number; F: number }, data: Float64Array) {
  let sum = 0.0;
  const len = data.length / 11;
  const { D, LP, L, F } = delArgs;
  const dnp_am_dnu = corrections.deltanp - am * corrections.deltanu;
  const dnu_factor = (2.0 / 3.0) * corrections.deltanu;
  const dGamma = corrections.deltaGamma;
  const dE = corrections.deltaE;
  const dep = corrections.deltaep;
  const factor = Math.PI / 648000.0;

  for (let r = 0; r < len; r++) {
    const offset = r * 11;
    const i1 = data[offset]!;
    const i2 = data[offset + 1]!;
    const i3 = data[offset + 2]!;
    const i4 = data[offset + 3]!;
    const A_coeff = data[offset + 4]!;
    const B1 = data[offset + 5]!;
    const B2 = data[offset + 6]!;
    const B3 = data[offset + 7]!;
    const B4 = data[offset + 8]!;
    const B5 = data[offset + 9]!;

    const A = A_coeff - A_coeff * dnu_factor
      + (B1 + dtasm * B5) * dnp_am_dnu
      + B2 * dGamma
      + B3 * dE
      + B4 * dep;
    sum += A * Math.cos((i1 * D + i2 * LP + i3 * L + i4 * F) * factor);
  }
  return sum;
}

// Layout: [i1, i2, i3, i4, i5, phi, A, B] (Stride = 8)
function computeNonPlanetary(precession: number, delArgs: { D: number; LP: number; L: number; F: number }, data: Float64Array) {
  let sum = 0.0;
  const len = data.length / 8;
  const { D, LP, L, F } = delArgs;
  const factor1 = Math.PI / 648000.0;
  const factor2 = Math.PI / 180.0;

  for (let r = 0; r < len; r++) {
    const offset = r * 8;
    const i1 = data[offset]!;
    const i2 = data[offset + 1]!;
    const i3 = data[offset + 2]!;
    const i4 = data[offset + 3]!;
    const i5 = data[offset + 4]!;
    const phi = data[offset + 5]!;
    const A = data[offset + 6]!;

    sum += A * Math.sin(
      (i1 * precession + i2 * D + i3 * LP + i4 * L + i5 * F) * factor1 + phi * factor2
    );
  }
  return sum;
}

// Layout: [i1, i2, i3, i4, i5, i6, i7, i8, i9, i10, i11, phi, A, B] (Stride = 14)
function computePlanetary1(planetaryArgs: number[], delArgs: { D: number; LP: number; L: number; F: number }, data: Float64Array) {
  let sum = 0.0;
  const len = data.length / 14;
  const p0 = planetaryArgs[0] ?? 0.0;
  const p1 = planetaryArgs[1] ?? 0.0;
  const p2 = planetaryArgs[2] ?? 0.0;
  const p3 = planetaryArgs[3] ?? 0.0;
  const p4 = planetaryArgs[4] ?? 0.0;
  const p5 = planetaryArgs[5] ?? 0.0;
  const p6 = planetaryArgs[6] ?? 0.0;
  const p7 = planetaryArgs[7] ?? 0.0;
  const { D, L, F } = delArgs;
  const factor1 = Math.PI / 648000.0;
  const factor2 = Math.PI / 180.0;

  for (let r = 0; r < len; r++) {
    const offset = r * 14;
    const i1 = data[offset]!;
    const i2 = data[offset + 1]!;
    const i3 = data[offset + 2]!;
    const i4 = data[offset + 3]!;
    const i5 = data[offset + 4]!;
    const i6 = data[offset + 5]!;
    const i7 = data[offset + 6]!;
    const i8 = data[offset + 7]!;
    const i9 = data[offset + 8]!;
    const i10 = data[offset + 9]!;
    const i11 = data[offset + 10]!;
    const phi = data[offset + 11]!;
    const A = data[offset + 12]!;

    sum += A * Math.sin(
      (i1 * p0 + i2 * p1 + i3 * p2 + i4 * p3 + i5 * p4 + i6 * p5 + i7 * p6 + i8 * p7
        + i9 * D + i10 * L + i11 * F) * factor1 + phi * factor2
    );
  }
  return sum;
}

// Layout: [i1, i2, i3, i4, i5, i6, i7, i8, i9, i10, i11, phi, A, B] (Stride = 14)
function computePlanetary2(planetaryArgs: number[], delArgs: { D: number; LP: number; L: number; F: number }, data: Float64Array) {
  let sum = 0.0;
  const len = data.length / 14;
  const p0 = planetaryArgs[0] ?? 0.0;
  const p1 = planetaryArgs[1] ?? 0.0;
  const p2 = planetaryArgs[2] ?? 0.0;
  const p3 = planetaryArgs[3] ?? 0.0;
  const p4 = planetaryArgs[4] ?? 0.0;
  const p5 = planetaryArgs[5] ?? 0.0;
  const p6 = planetaryArgs[6] ?? 0.0;
  const { D, LP, L, F } = delArgs;
  const factor1 = Math.PI / 648000.0;
  const factor2 = Math.PI / 180.0;

  for (let r = 0; r < len; r++) {
    const offset = r * 14;
    const i1 = data[offset]!;
    const i2 = data[offset + 1]!;
    const i3 = data[offset + 2]!;
    const i4 = data[offset + 3]!;
    const i5 = data[offset + 4]!;
    const i6 = data[offset + 5]!;
    const i7 = data[offset + 6]!;
    const i8 = data[offset + 7]!;
    const i9 = data[offset + 8]!;
    const i10 = data[offset + 9]!;
    const i11 = data[offset + 10]!;
    const phi = data[offset + 11]!;
    const A = data[offset + 12]!;

    sum += A * Math.sin(
      (i1 * p0 + i2 * p1 + i3 * p2 + i4 * p3 + i5 * p4 + i6 * p5 + i7 * p6
        + i8 * D + i9 * LP + i10 * L + i11 * F) * factor1 + phi * factor2
    );
  }
  return sum;
}

export function elp2000SphericalOfDate(JT: number) {
  const T = (JT - 2451545.0) / 36525.0;

  const elpArgumentsFull = evaluateArgumentPolynomials(T, 5);
  const delArgsFull = evaluateDelaunayArguments(elpArgumentsFull);

  const elpArgumentsLin = evaluateArgumentPolynomials(T, 2);
  const delArgsLin = evaluateDelaunayArguments(elpArgumentsLin);
  const poly0 = argumentPolynomialCoefficients[0];
  const coeff0_0 = poly0?.[0] ?? 0.0;
  const coeff0_1 = poly0?.[1] ?? 0.0;
  const zeta = coeff0_0 + T * (coeff0_1 + precessionConstant);
  const planetaryArgs = evaluatePlanetaryArguments(T);

  // Note: Casted through `unknown` since ELP maps to PackedTermProxy structure.
  const data = elp2000Data as unknown as Record<string, { data: Float64Array }>;

  // Main problem.
  let longitude = computeMainFigureSin(delArgsFull, data.ELP01!.data);
  let latitude = computeMainFigureSin(delArgsFull, data.ELP02!.data);
  let distance = computeMainFigureCos(delArgsFull, data.ELP03!.data);

  // Earth figure perturbations.
  longitude += computeNonPlanetary(zeta, delArgsLin, data.ELP04!.data);
  latitude += computeNonPlanetary(zeta, delArgsLin, data.ELP05!.data);
  distance += computeNonPlanetary(zeta, delArgsLin, data.ELP06!.data);
  longitude += computeNonPlanetary(zeta, delArgsLin, data.ELP07!.data) * T;
  latitude += computeNonPlanetary(zeta, delArgsLin, data.ELP08!.data) * T;
  distance += computeNonPlanetary(zeta, delArgsLin, data.ELP09!.data) * T;

  // Planetary perturbations. Table 1.
  longitude += computePlanetary1(planetaryArgs, delArgsLin, data.ELP10!.data);
  latitude += computePlanetary1(planetaryArgs, delArgsLin, data.ELP11!.data);
  distance += computePlanetary1(planetaryArgs, delArgsLin, data.ELP12!.data);
  longitude += computePlanetary1(planetaryArgs, delArgsLin, data.ELP13!.data) * T;
  latitude += computePlanetary1(planetaryArgs, delArgsLin, data.ELP14!.data) * T;
  distance += computePlanetary1(planetaryArgs, delArgsLin, data.ELP15!.data) * T;

  // Planetary perturbations. Table 2.
  longitude += computePlanetary2(planetaryArgs, delArgsLin, data.ELP16!.data);
  latitude += computePlanetary2(planetaryArgs, delArgsLin, data.ELP17!.data);
  distance += computePlanetary2(planetaryArgs, delArgsLin, data.ELP18!.data);
  longitude += computePlanetary2(planetaryArgs, delArgsLin, data.ELP19!.data) * T;
  latitude += computePlanetary2(planetaryArgs, delArgsLin, data.ELP20!.data) * T;
  distance += computePlanetary2(planetaryArgs, delArgsLin, data.ELP21!.data) * T;

  // Tidal effects.
  longitude += computeNonPlanetary(0.0, delArgsLin, data.ELP22!.data);
  latitude += computeNonPlanetary(0.0, delArgsLin, data.ELP23!.data);
  distance += computeNonPlanetary(0.0, delArgsLin, data.ELP24!.data);
  longitude += computeNonPlanetary(0.0, delArgsLin, data.ELP25!.data) * T;
  latitude += computeNonPlanetary(0.0, delArgsLin, data.ELP26!.data) * T;
  distance += computeNonPlanetary(0.0, delArgsLin, data.ELP27!.data) * T;

  // Moon figure perturbations.
  longitude += computeNonPlanetary(0.0, delArgsLin, data.ELP28!.data);
  latitude += computeNonPlanetary(0.0, delArgsLin, data.ELP29!.data);
  distance += computeNonPlanetary(0.0, delArgsLin, data.ELP30!.data);

  // Relativistic perturbation.
  longitude += computeNonPlanetary(0.0, delArgsLin, data.ELP31!.data);
  latitude += computeNonPlanetary(0.0, delArgsLin, data.ELP32!.data);
  distance += computeNonPlanetary(0.0, delArgsLin, data.ELP33!.data);

  // Planetary perturbations (solar eccentricity).
  longitude += computeNonPlanetary(0.0, delArgsLin, data.ELP34!.data) * T * T;
  latitude += computeNonPlanetary(0.0, delArgsLin, data.ELP35!.data) * T * T;
  distance += computeNonPlanetary(0.0, delArgsLin, data.ELP36!.data) * T * T;

  longitude += elpArgumentsFull.W1;

  // Convert longitude and latitude from arcseconds to degrees:
  return {
    longitude: longitude / 3600.0,
    latitude: latitude / 3600.0,
    distanceKm: distance
  };
}

export function computeLunarPosition(j: number, ut: number, deltaT: number): LunarPositionResult {
  const { jd, t, te } = timeArguments(j, ut, deltaT);

  // Compute spherical coordinates in the inertial frame of date (J2000 equinox)
  const coords = elp2000SphericalOfDate(jd);

  // Apply general precession in longitude to refer to the mean equinox of date
  const pA = (5029.0966 * te + 1.11161 * te * te - 0.000113 * te * te * te) / 3600;
  const lambdaMoonMean = normalizeDegrees(coords.longitude + pA);

  // Nutation
  const { deltaPsi, eps } = computeNutation(j, ut, deltaT);
  const lambdaMoonApparent = normalizeDegrees(lambdaMoonMean + deltaPsi);
  const betaMoon = coords.latitude;
  const distanceKm = coords.distanceKm;

  // Convert to RA and Dec
  const RA = normalizeDegrees(
    atand2(
      sind(lambdaMoonApparent) * cosd(eps) - tand(betaMoon) * sind(eps),
      cosd(lambdaMoonApparent)
    )
  );
  const Dec = asind(
    sind(betaMoon) * cosd(eps) + cosd(betaMoon) * sind(eps) * sind(lambdaMoonApparent)
  );

  // Sidereal Time
  const GMST = normalizeDegrees(
    280.46061837 + 360.98564736629 * (jd - 2451545) + t * t * (0.000387933 - t / 38710000)
  );
  const GAST = normalizeDegrees(GMST + deltaPsi * cosd(eps));
  const GHAMoon = normalizeDegrees(GAST - RA);

  // Horizontal parallax and semidiameter
  const HPMoon = asind(6378.14 / distanceKm);
  const SDMoon = asind(1738 / distanceKm);

  // Phase & illumination
  const sun = computeSolarPosition(j, ut, deltaT);
  const psi = acosd(
    sind(sun.declination) * sind(Dec) +
      cosd(sun.declination) * cosd(Dec) * cosd(sun.rightAscension - RA)
  );
  const deltaSun = 1.496e8 * sun.distanceAu;
  const iAngle = atand2(deltaSun * sind(psi), distanceKm - deltaSun * cosd(psi));
  const k = (1 + Math.cos(iAngle * (Math.PI / 180))) / 2;

  return {
    rightAscension: RA,
    declination: Dec,
    gha: GHAMoon,
    sha: normalizeDegrees(360 - RA),
    horizontalParallax: HPMoon,
    semidiameter: SDMoon,
    distanceKm,
    illuminationFraction: k,
    apparentLongitude: lambdaMoonApparent,
  };
}
