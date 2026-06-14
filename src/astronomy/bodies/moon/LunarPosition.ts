import { acosd, asind, atand2, cosd, sind, tand } from '../../../internal/trig.js';
import { normalizeDegrees } from '../../../internal/angles.js';
import { timeArguments } from '../../time/JulianDate.js';
import { computeNutation } from '../../theories/nutation/iau1980.js';
import { SolarEphemeris } from '../sun/SolarPosition.js';
import type { LunarPositionResult } from '../../types/ephemeris.js';

const CF_D: number[] = [0,2,2,0,0,0,2,2,2,2,0,1,0,2,0,0,4,0,4,2,2,1,1,2,2,4,2,0,2,2,1,2,0,0,2,2,2,4,0,3,2,4,0,2,2,2,4,0,4,1,2,0,1,3,4,2,0,1,2,2];
const CF_M: number[] = [0,0,0,0,1,0,0,-1,0,-1,1,0,1,0,0,0,0,0,0,1,1,0,1,-1,0,0,0,1,0,-1,0,-2,1,2,-2,0,0,-1,0,0,1,-1,2,2,1,-1,0,0,-1,0,1,0,1,0,0,-1,2,1,0,0];
const CF_M_DASH: number[] = [1,-1,0,2,0,0,-2,-1,1,0,-1,0,1,0,1,1,-1,3,-2,-1,0,-1,0,1,2,0,-3,-2,-1,-2,1,0,2,0,-1,1,0,-1,2,-1,1,-2,-1,-1,-2,0,1,4,0,-2,0,2,1,-2,-3,2,1,-1,3,-1];
const CF_F: number[] = [0,0,0,0,0,2,0,0,0,0,0,0,0,-2,2,-2,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,-2,2,0,2,0,0,0,0,0,0,-2,0,0,0,0,-2,-2,0,0,0,0,0,0,0,-2];
const CF_SINE: number[] = [6288774,1274027,658314,213618,-185116,-114332,58793,57066,53322,45758,-40923,-34720,-30383,15327,-12528,10980,10675,10034,8548,-7888,-6766,-5163,4987,4036,3994,3861,3665,-2689,-2602,2390,-2348,2236,-2120,-2069,2048,-1773,-1595,1215,-1110,-892,-810,759,-713,-700,691,596,549,537,520,-487,-399,-381,351,-340,330,327,-323,299,294,0];
const CF_COSINE: number[] = [-20905355,-3699111,-2955968,-569925,48888,-3149,246158,-152138,-170733,-204586,-129620,108743,104755,10321,0,79661,-34782,-23210,-21636,24208,30824,-8379,-16675,-12831,-10445,-11650,14403,-7003,0,10056,6322,-9884,5751,0,-4950,4130,0,-3958,0,3258,2616,-1897,-2117,2354,0,0,-1423,-1117,-1571,-1739,0,-4421,0,0,0,0,1165,0,0,8752];

const CF_D_B: number[] = [0,0,0,2,2,2,2,0,2,0,2,2,2,2,2,2,2,0,4,0,0,0,1,0,0,0,1,0,4,4,0,4,2,2,2,2,0,2,2,2,2,4,2,2,0,2,1,1,0,2,1,2,0,4,4,1,4,1,4,2];
const CF_M_B: number[] = [0,0,0,0,0,0,0,0,0,0,-1,0,0,1,-1,-1,-1,1,0,1,0,1,0,1,1,1,0,0,0,0,0,0,0,0,-1,0,0,0,0,1,1,0,-1,-2,0,1,1,1,1,1,0,-1,1,0,-1,0,0,0,-1,-2];
const CF_M_DASH_B: number[] = [0,1,1,0,-1,-1,0,2,1,2,0,-2,1,0,-1,0,-1,-1,-1,0,0,-1,0,1,1,0,0,3,0,-1,1,-2,0,2,1,-2,3,2,-3,-1,0,0,1,0,1,1,0,0,-2,-1,1,-2,2,-2,-1,1,1,-1,0,0];
const CF_F_B: number[] = [1,1,-1,-1,1,-1,1,1,-1,-1,-1,-1,1,-1,1,1,-1,-1,-1,1,3,1,1,1,-1,-1,-1,1,-1,1,-3,1,-3,-1,-1,1,-1,1,-1,1,1,1,1,-1,3,-1,-1,1,-1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,1];
const CF_SINE_B: number[] = [5128122,280602,277693,173237,55413,46271,32573,17198,9266,8822,8216,4324,4200,-3359,2463,2211,2065,-1870,1828,-1794,-1749,-1565,-1491,-1475,-1410,-1344,-1335,1107,1021,833,777,671,607,596,491,-451,439,422,421,-366,-351,331,315,302,-283,-229,223,223,-220,-220,-185,181,-177,176,166,-164,132,-119,115,107];

const LUNAR_AMPLITUDES = {
  sumL: {
    d: CF_D,
    m: CF_M,
    mPrime: CF_M_DASH,
    f: CF_F,
    coefficients: CF_SINE,
  },
  sumR: {
    d: CF_D,
    m: CF_M,
    mPrime: CF_M_DASH,
    f: CF_F,
    coefficients: CF_COSINE,
  },
  sumB: {
    d: CF_D_B,
    m: CF_M_B,
    mPrime: CF_M_DASH_B,
    f: CF_F_B,
    coefficients: CF_SINE_B,
  },
} as const;

function applyEccentricity(value: number, mfactor: number, e: number): number {
  if (mfactor === 1 || mfactor === -1) {
    return value * e;
  }
  if (mfactor === 2 || mfactor === -2) {
    return value * e * e;
  }
  return value;
}

export class LunarEphemeris {
  private _timeArguments?: { jd: number; t: number; te: number };
  private _Ldash?: number;
  private _D?: number;
  private _M?: number;
  private _Mdash?: number;
  private _F?: number;
  private _A_1?: number;
  private _A_2?: number;
  private _A_3?: number;
  private _E?: number;
  private _nutation?: ReturnType<typeof computeNutation>;
  private _lambdaMoon?: number;
  private _lambdaMoonApparent?: number;
  private _deltaMoon?: number;
  private _betaMoon?: number;
  private _RA?: number;
  private _Dec?: number;
  private _GMST?: number;
  private _GAST?: number;
  private _GHA?: number;
  private _SHA?: number;
  private _HPMoon?: number;
  private _SDMoon?: number;
  private _sunEngine?: SolarEphemeris;
  private _illuminationFraction?: number;

  constructor(readonly j: number, readonly ut: number, readonly deltaT: number) {}

  private get timeArgs() {
    if (!this._timeArguments) {
      this._timeArguments = timeArguments(this.j, this.ut, this.deltaT);
    }
    return this._timeArguments;
  }

  private get Ldash() {
    if (this._Ldash === undefined) {
      this._Ldash =
        218.316447 +
        this.timeArgs.te * (this.timeArgs.te * (this.timeArgs.te * (1.85584e-6 - this.timeArgs.te / 65194000) - 0.0015786) + 481267.88123421);
    }
    return this._Ldash;
  }

  private get D() {
    if (this._D === undefined) {
      this._D =
        297.8501921 +
        this.timeArgs.te * (this.timeArgs.te * (this.timeArgs.te * (1.83194e-6 - this.timeArgs.te / 113065000) - 0.0018819) + 445267.1114034);
    }
    return this._D;
  }

  private get M() {
    if (this._M === undefined) {
      this._M =
        357.5291092 +
        this.timeArgs.te * (this.timeArgs.te * (this.timeArgs.te / 24490000 - 0.0001536) + 35999.0502909);
    }
    return this._M;
  }

  private get Mdash() {
    if (this._Mdash === undefined) {
      this._Mdash =
        134.9633964 +
        this.timeArgs.te * (this.timeArgs.te * (this.timeArgs.te * (1.434741e-5 - this.timeArgs.te / 14712000) + 0.0087414) + 477198.8675055);
    }
    return this._Mdash;
  }

  private get F() {
    if (this._F === undefined) {
      this._F =
        93.272095 +
        this.timeArgs.te *
          (this.timeArgs.te * (this.timeArgs.te * (this.timeArgs.te / 8633100000 - 2.8361e-7) - 0.0036539) + 483202.0175233);
    }
    return this._F;
  }

  private get A_1() {
    if (this._A_1 === undefined) {
      this._A_1 = normalizeDegrees(119.75 + 131.849 * this.timeArgs.te);
    }
    return this._A_1;
  }

  private get A_2() {
    if (this._A_2 === undefined) {
      this._A_2 = normalizeDegrees(53.09 + 479264.29 * this.timeArgs.te);
    }
    return this._A_2;
  }

  private get A_3() {
    if (this._A_3 === undefined) {
      this._A_3 = normalizeDegrees(313.45 + 481266.484 * this.timeArgs.te);
    }
    return this._A_3;
  }

  private get E() {
    if (this._E === undefined) {
      this._E = 1 - this.timeArgs.te * (this.timeArgs.te * 0.0000074 + 0.002516);
    }
    return this._E;
  }

  private get nutation() {
    if (!this._nutation) {
      this._nutation = computeNutation(this.timeArgs.jd, this.ut, this.deltaT);
    }
    return this._nutation;
  }

  private get lambdaMoon() {
    if (this._lambdaMoon === undefined) {
      const sumL = LUNAR_AMPLITUDES.sumL.coefficients.reduce((acc, coefficient, i) => {
        const argument =
          LUNAR_AMPLITUDES.sumL.d[i]! * this.D +
          LUNAR_AMPLITUDES.sumL.m[i]! * this.M +
          LUNAR_AMPLITUDES.sumL.mPrime[i]! * this.Mdash +
          LUNAR_AMPLITUDES.sumL.f[i]! * this.F;
        return acc + applyEccentricity(coefficient * sind(argument), LUNAR_AMPLITUDES.sumL.m[i]!, this.E);
      }, 0);

      this._lambdaMoon = normalizeDegrees(
        this.Ldash + (sumL + 3958 * sind(this.A_1) + 1962 * sind(this.Ldash - this.F) + 318 * sind(this.A_2)) / 1000000,
      );
    }
    return this._lambdaMoon;
  }

  private get lambdaMoonApparent() {
    if (this._lambdaMoonApparent === undefined) {
      this._lambdaMoonApparent = this.lambdaMoon + this.nutation.deltaPsi;
    }
    return this._lambdaMoonApparent;
  }

  private get deltaMoon() {
    if (this._deltaMoon === undefined) {
      const sumR = LUNAR_AMPLITUDES.sumR.coefficients.reduce((acc, coefficient, i) => {
        const argument =
          LUNAR_AMPLITUDES.sumR.d[i]! * this.D +
          LUNAR_AMPLITUDES.sumR.m[i]! * this.M +
          LUNAR_AMPLITUDES.sumR.mPrime[i]! * this.Mdash +
          LUNAR_AMPLITUDES.sumR.f[i]! * this.F;
        return acc + applyEccentricity(coefficient * cosd(argument), LUNAR_AMPLITUDES.sumR.m[i]!, this.E);
      }, 0);

      this._deltaMoon = 385000.56 + sumR / 1000;
    }
    return this._deltaMoon;
  }

  private get betaMoon() {
    if (this._betaMoon === undefined) {
      const sumB = LUNAR_AMPLITUDES.sumB.coefficients.reduce((acc, coefficient, i) => {
        const argument =
          LUNAR_AMPLITUDES.sumB.d[i]! * this.D +
          LUNAR_AMPLITUDES.sumB.m[i]! * this.M +
          LUNAR_AMPLITUDES.sumB.mPrime[i]! * this.Mdash +
          LUNAR_AMPLITUDES.sumB.f[i]! * this.F;
        return acc + coefficient * sind(argument);
      }, 0);

      this._betaMoon =
        (sumB -
          2235 * sind(this.Ldash) +
          382 * sind(this.A_3) +
          175 * sind(this.A_1 - this.F) +
          175 * sind(this.A_1 + this.F) +
          127 * sind(this.Ldash - this.Mdash) -
          115 * sind(this.Ldash + this.Mdash)) /
        1000000;
    }
    return this._betaMoon;
  }

  get rightAscension() {
    if (this._RA === undefined) {
      this._RA = normalizeDegrees(
        atand2(
          sind(this.lambdaMoonApparent) * cosd(this.nutation.eps) - tand(this.betaMoon) * sind(this.nutation.eps),
          cosd(this.lambdaMoonApparent),
        ),
      );
    }
    return this._RA;
  }

  get declination() {
    if (this._Dec === undefined) {
      this._Dec = asind(
        sind(this.betaMoon) * cosd(this.nutation.eps) + cosd(this.betaMoon) * sind(this.nutation.eps) * sind(this.lambdaMoonApparent),
      );
    }
    return this._Dec;
  }

  get gmst() {
    if (this._GMST === undefined) {
      this._GMST = normalizeDegrees(
        280.46061837 +
          360.98564736629 * (this.timeArgs.jd - 2451545) +
          this.timeArgs.t * this.timeArgs.t * (0.000387933 - this.timeArgs.t / 38710000),
      );
    }
    return this._GMST;
  }

  get gast() {
    if (this._GAST === undefined) {
      this._GAST = normalizeDegrees(this.gmst + this.nutation.deltaPsi * cosd(this.nutation.eps));
    }
    return this._GAST;
  }

  get gha() {
    if (this._GHA === undefined) {
      this._GHA = normalizeDegrees(this.gast - this.rightAscension);
    }
    return this._GHA;
  }

  get sha() {
    if (this._SHA === undefined) {
      this._SHA = normalizeDegrees(360 - this.rightAscension);
    }
    return this._SHA;
  }

  get horizontalParallax() {
    if (this._HPMoon === undefined) {
      this._HPMoon = asind(6378.14 / this.deltaMoon) * 3600;
    }
    return this._HPMoon;
  }

  get semidiameter() {
    if (this._SDMoon === undefined) {
      this._SDMoon = asind(1738 / this.deltaMoon) * 3600;
    }
    return this._SDMoon;
  }

  private get sunEngine() {
    if (!this._sunEngine) {
      this._sunEngine = new SolarEphemeris(this.j, this.ut, this.deltaT);
    }
    return this._sunEngine;
  }

  get illuminationFraction() {
    if (this._illuminationFraction === undefined) {
      let elongation = this.lambdaMoonApparent - this.sunEngine.apparentLongitude;
      if (elongation < 0) {
        elongation += 360;
      }
      const cosI = cosd(elongation);
      const kPercent = 100 * (1 - cosI) / 2;
      this._illuminationFraction = Math.round(kPercent * 10) / 10 / 100;
    }
    return this._illuminationFraction;
  }

  get distanceKm() {
    return this.deltaMoon;
  }

  get apparentLongitude() {
    return this.lambdaMoonApparent;
  }
}

export function computeLunarPosition(j: number, ut: number, deltaT: number): LunarPositionResult {
  const engine = new LunarEphemeris(j, ut, deltaT);
  return {
    rightAscension: engine.rightAscension,
    declination: engine.declination,
    gha: engine.gha,
    sha: engine.sha,
    horizontalParallax: engine.horizontalParallax,
    semidiameter: engine.semidiameter,
    distanceKm: engine.distanceKm,
    illuminationFraction: engine.illuminationFraction,
    apparentLongitude: engine.apparentLongitude,
  };
}
