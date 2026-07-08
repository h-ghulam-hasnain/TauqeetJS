import { acosd, asind, atand2, cosd, sind, tand } from '../../../internal/trig.js';
import { normalizeDegrees } from '../../../internal/angles.js';
import { timeArguments } from '../../time/JulianDate.js';
import { computeNutation } from '../nutation/iau2000b.js';
import { computeSolarPosition } from '../../bodies/sun/SolarPosition.js';
import { elp2000Data } from './elp2000Data.js';
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

function evaluateArgumentPolynomials(t: number, n: number) {
  const elpArguments = [0.0, 0.0, 0.0, 0.0, 0.0];
  for (let i = 0; i < 5; i++) {
    let sum = 0.0;
    const coeffs = argumentPolynomialCoefficients[i];
    if (coeffs) {
      let tn = 1.0;
      for (let j = 0; j < n; j++) {
        const coeff = coeffs[j];
        if (coeff !== undefined) {
          sum += coeff * tn;
        }
        tn *= t;
      }
    }
    elpArguments[i] = sum;
  }
  return {
    W1: elpArguments[0] ?? 0.0,
    W2: elpArguments[1] ?? 0.0,
    W3: elpArguments[2] ?? 0.0,
    T: elpArguments[3] ?? 0.0,
    OBP: elpArguments[4] ?? 0.0
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
      const c0 = coeffs[0];
      const c1 = coeffs[1];
      if (c0 !== undefined && c1 !== undefined) {
        planetaryArguments.push(c0 + c1 * t);
      }
    }
  }
  return planetaryArguments;
}

interface ELPTerm {
  i1: number;
  i2: number;
  i3: number;
  i4: number;
  A: number;
  B1: number;
  B2: number;
  B3: number;
  B4: number;
  B5: number;
  B6: number;
}

function computeMainFigureSin(delArgs: { D: number; LP: number; L: number; F: number }, data: ELPTerm[]) {
  let sum = 0.0;
  for (let i = 0; i < data.length; i++) {
    const term = data[i]!;
    const A = term.A
      + (term.B1 + dtasm * term.B5) * (corrections.deltanp - am * corrections.deltanu)
      + term.B2 * corrections.deltaGamma
      + term.B3 * corrections.deltaE
      + term.B4 * corrections.deltaep;
    sum += A * Math.sin((term.i1 * delArgs.D + term.i2 * delArgs.LP + term.i3 * delArgs.L + term.i4 * delArgs.F) * Math.PI / 648000.0);
  }
  return sum;
}

function computeMainFigureCos(delArgs: { D: number; LP: number; L: number; F: number }, data: ELPTerm[]) {
  let sum = 0.0;
  for (let i = 0; i < data.length; i++) {
    const term = data[i]!;
    const A = term.A - (2.0 / 3.0) * term.A * corrections.deltanu
      + (term.B1 + dtasm * term.B5) * (corrections.deltanp - am * corrections.deltanu)
      + term.B2 * corrections.deltaGamma
      + term.B3 * corrections.deltaE
      + term.B4 * corrections.deltaep;
    sum += A * Math.cos((term.i1 * delArgs.D + term.i2 * delArgs.LP + term.i3 * delArgs.L + term.i4 * delArgs.F) * Math.PI / 648000.0);
  }
  return sum;
}

interface NonPlanetaryTerm {
  i1: number;
  i2: number;
  i3: number;
  i4: number;
  i5: number;
  phi: number;
  A: number;
  B: number;
}

function computeNonPlanetary(precession: number, delArgs: { D: number; LP: number; L: number; F: number }, data: NonPlanetaryTerm[]) {
  let sum = 0.0;
  for (let i = 0; i < data.length; i++) {
    const term = data[i]!;
    sum += term.A * Math.sin(
      (term.i1 * precession + term.i2 * delArgs.D + term.i3 * delArgs.LP + term.i4 * delArgs.L + term.i5 * delArgs.F) * Math.PI / 648000.0
      + term.phi * Math.PI / 180.0
    );
  }
  return sum;
}

interface PlanetaryTerm {
  i1: number;
  i2: number;
  i3: number;
  i4: number;
  i5: number;
  i6: number;
  i7: number;
  i8: number;
  i9: number;
  i10: number;
  i11: number;
  phi: number;
  A: number;
  B: number;
}

function computePlanetary1(planetaryArgs: number[], delArgs: { D: number; LP: number; L: number; F: number }, data: PlanetaryTerm[]) {
  let sum = 0.0;
  const p0 = planetaryArgs[0] ?? 0.0;
  const p1 = planetaryArgs[1] ?? 0.0;
  const p2 = planetaryArgs[2] ?? 0.0;
  const p3 = planetaryArgs[3] ?? 0.0;
  const p4 = planetaryArgs[4] ?? 0.0;
  const p5 = planetaryArgs[5] ?? 0.0;
  const p6 = planetaryArgs[6] ?? 0.0;
  const p7 = planetaryArgs[7] ?? 0.0;
  for (let i = 0; i < data.length; i++) {
    const term = data[i]!;
    sum += term.A * Math.sin(
      (term.i1 * p0
        + term.i2 * p1
        + term.i3 * p2
        + term.i4 * p3
        + term.i5 * p4
        + term.i6 * p5
        + term.i7 * p6
        + term.i8 * p7
        + term.i9 * delArgs.D
        + term.i10 * delArgs.L
        + term.i11 * delArgs.F) * Math.PI / 648000.0
      + term.phi * Math.PI / 180.0
    );
  }
  return sum;
}

function computePlanetary2(planetaryArgs: number[], delArgs: { D: number; LP: number; L: number; F: number }, data: PlanetaryTerm[]) {
  let sum = 0.0;
  const p0 = planetaryArgs[0] ?? 0.0;
  const p1 = planetaryArgs[1] ?? 0.0;
  const p2 = planetaryArgs[2] ?? 0.0;
  const p3 = planetaryArgs[3] ?? 0.0;
  const p4 = planetaryArgs[4] ?? 0.0;
  const p5 = planetaryArgs[5] ?? 0.0;
  const p6 = planetaryArgs[6] ?? 0.0;
  for (let i = 0; i < data.length; i++) {
    const term = data[i]!;
    sum += term.A * Math.sin(
      (term.i1 * p0
        + term.i2 * p1
        + term.i3 * p2
        + term.i4 * p3
        + term.i5 * p4
        + term.i6 * p5
        + term.i7 * p6
        + term.i8 * delArgs.D
        + term.i9 * delArgs.LP
        + term.i10 * delArgs.L
        + term.i11 * delArgs.F) * Math.PI / 648000.0
      + term.phi * Math.PI / 180.0
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

  // Main problem.
  let longitude = computeMainFigureSin(delArgsFull, elp2000Data.ELP01 as unknown as ELPTerm[]);
  let latitude = computeMainFigureSin(delArgsFull, elp2000Data.ELP02 as unknown as ELPTerm[]);
  let distance = computeMainFigureCos(delArgsFull, elp2000Data.ELP03 as unknown as ELPTerm[]);

  // Earth figure perturbations.
  longitude += computeNonPlanetary(zeta, delArgsLin, elp2000Data.ELP04 as unknown as NonPlanetaryTerm[]);
  latitude += computeNonPlanetary(zeta, delArgsLin, elp2000Data.ELP05 as unknown as NonPlanetaryTerm[]);
  distance += computeNonPlanetary(zeta, delArgsLin, elp2000Data.ELP06 as unknown as NonPlanetaryTerm[]);
  longitude += computeNonPlanetary(zeta, delArgsLin, elp2000Data.ELP07 as unknown as NonPlanetaryTerm[]) * T;
  latitude += computeNonPlanetary(zeta, delArgsLin, elp2000Data.ELP08 as unknown as NonPlanetaryTerm[]) * T;
  distance += computeNonPlanetary(zeta, delArgsLin, elp2000Data.ELP09 as unknown as NonPlanetaryTerm[]) * T;

  // Planetary perturbations. Table 1.
  longitude += computePlanetary1(planetaryArgs, delArgsLin, elp2000Data.ELP10 as unknown as PlanetaryTerm[]);
  latitude += computePlanetary1(planetaryArgs, delArgsLin, elp2000Data.ELP11 as unknown as PlanetaryTerm[]);
  distance += computePlanetary1(planetaryArgs, delArgsLin, elp2000Data.ELP12 as unknown as PlanetaryTerm[]);
  longitude += computePlanetary1(planetaryArgs, delArgsLin, elp2000Data.ELP13 as unknown as PlanetaryTerm[]) * T;
  latitude += computePlanetary1(planetaryArgs, delArgsLin, elp2000Data.ELP14 as unknown as PlanetaryTerm[]) * T;
  distance += computePlanetary1(planetaryArgs, delArgsLin, elp2000Data.ELP15 as unknown as PlanetaryTerm[]) * T;

  // Planetary perturbations. Table 2.
  longitude += computePlanetary2(planetaryArgs, delArgsLin, elp2000Data.ELP16 as unknown as PlanetaryTerm[]);
  latitude += computePlanetary2(planetaryArgs, delArgsLin, elp2000Data.ELP17 as unknown as PlanetaryTerm[]);
  distance += computePlanetary2(planetaryArgs, delArgsLin, elp2000Data.ELP18 as unknown as PlanetaryTerm[]);
  longitude += computePlanetary2(planetaryArgs, delArgsLin, elp2000Data.ELP19 as unknown as PlanetaryTerm[]) * T;
  latitude += computePlanetary2(planetaryArgs, delArgsLin, elp2000Data.ELP20 as unknown as PlanetaryTerm[]) * T;
  distance += computePlanetary2(planetaryArgs, delArgsLin, elp2000Data.ELP21 as unknown as PlanetaryTerm[]) * T;

  // Tidal effects.
  longitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP22 as unknown as NonPlanetaryTerm[]);
  latitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP23 as unknown as NonPlanetaryTerm[]);
  distance += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP24 as unknown as NonPlanetaryTerm[]);
  longitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP25 as unknown as NonPlanetaryTerm[]) * T;
  latitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP26 as unknown as NonPlanetaryTerm[]) * T;
  distance += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP27 as unknown as NonPlanetaryTerm[]) * T;

  // Moon figure perturbations.
  longitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP28 as unknown as NonPlanetaryTerm[]);
  latitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP29 as unknown as NonPlanetaryTerm[]);
  distance += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP30 as unknown as NonPlanetaryTerm[]);

  // Relativistic perturbation.
  longitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP31 as unknown as NonPlanetaryTerm[]);
  latitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP32 as unknown as NonPlanetaryTerm[]);
  distance += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP33 as unknown as NonPlanetaryTerm[]);

  // Planetary perturbations (solar eccentricity).
  longitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP34 as unknown as NonPlanetaryTerm[]) * T * T;
  latitude += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP35 as unknown as NonPlanetaryTerm[]) * T * T;
  distance += computeNonPlanetary(0.0, delArgsLin, elp2000Data.ELP36 as unknown as NonPlanetaryTerm[]) * T * T;

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
