import { atand2, asind, cosd, sind, tand } from '../../../internal/trig.js';
import { normalizeDegrees, radiansToDegrees } from '../../../internal/angles.js';
import { timeArguments } from '../../time/JulianDate.js';
import { computeEarthHeliocentricState } from '../../theories/vsop87/vsop87.js';
import { computeNutation } from '../../theories/nutation/iau1980.js';
import { computeSolarAberration } from '../../earth/Aberration.js';
import type { SolarPositionResult } from '../../types/ephemeris.js';

/**
 * Internal solar ephemeris engine.
 * Computes only the quantities requested by the consumer.
 */
export class SolarEphemeris {
  private _timeArguments?: { jd: number; t: number; te: number; tau: number };
  private _earthState?: ReturnType<typeof computeEarthHeliocentricState>;
  private _nutation?: ReturnType<typeof computeNutation>;
  private _aberration?: number;
  private _L_sun?: number;
  private _Beta_sun?: number;
  private _L_prime?: number;
  private _Delta_L?: number;
  private _Delta_B?: number;
  private _L_corr?: number;
  private _B_corr?: number;
  private _apparentLongitude?: number;
  private _RA?: number;
  private _Dec?: number;
  private _GMST?: number;
  private _GAST?: number;
  private _GHA?: number;
  private _SHA?: number;
  private _equationOfTime?: number;
  private _semidiameter?: number;
  private _horizontalParallax?: number;

  constructor(readonly j: number, readonly ut: number, readonly deltaT: number) {}

  private get timeArgs() {
    if (!this._timeArguments) {
      this._timeArguments = timeArguments(this.j, this.ut, this.deltaT);
    }
    return this._timeArguments;
  }

  private get earthState() {
    if (!this._earthState) {
      this._earthState = computeEarthHeliocentricState(this.timeArgs.tau);
    }
    return this._earthState;
  }

  private get nutation() {
    if (!this._nutation) {
      this._nutation = computeNutation(this.timeArgs.jd, this.ut, this.deltaT);
    }
    return this._nutation;
  }

  private get aberration() {
    if (this._aberration === undefined) {
      this._aberration = computeSolarAberration(this.earthState.radius);
    }
    return this._aberration;
  }

  private get L_sun() {
    if (this._L_sun === undefined) {
      const Ldd = radiansToDegrees(this.earthState.longitude);
      this._L_sun = normalizeDegrees(Ldd + 180);
    }
    return this._L_sun;
  }

  private get Beta_sun() {
    if (this._Beta_sun === undefined) {
      this._Beta_sun = -radiansToDegrees(this.earthState.latitude);
    }
    return this._Beta_sun;
  }

  private get L_prime() {
    if (this._L_prime === undefined) {
      this._L_prime = normalizeDegrees(this.L_sun - this.timeArgs.te * (1.397 + 0.00031 * this.timeArgs.te));
    }
    return this._L_prime;
  }

  private get Delta_L() {
    if (this._Delta_L === undefined) {
      this._Delta_L = (-0.09033 + 0.03916 * (cosd(this.L_prime) + sind(this.L_prime)) * tand(this.B_corr)) / 3600;
    }
    return this._Delta_L;
  }

  private get Delta_B() {
    if (this._Delta_B === undefined) {
      this._Delta_B = 0.03916 * (cosd(this.L_prime) - sind(this.L_prime)) / 3600;
    }
    return this._Delta_B;
  }

  private get L_corr() {
    if (this._L_corr === undefined) {
      this._L_corr = this.L_sun + this.Delta_L;
    }
    return this._L_corr;
  }

  private get B_corr() {
    if (this._B_corr === undefined) {
      this._B_corr = this.Beta_sun + this.Delta_B;
    }
    return this._B_corr;
  }

  get apparentLongitude() {
    if (this._apparentLongitude === undefined) {
      this._apparentLongitude = this.L_corr + this.nutation.deltaPsi + this.aberration;
    }
    return this._apparentLongitude;
  }

  get rightAscension() {
    if (this._RA === undefined) {
      this._RA = normalizeDegrees(
        atand2(
          sind(this.apparentLongitude) * cosd(this.nutation.eps) - tand(this.B_corr) * sind(this.nutation.eps),
          cosd(this.apparentLongitude),
        ),
      );
    }
    return this._RA;
  }

  get declination() {
    if (this._Dec === undefined) {
      this._Dec = asind(
        sind(this.B_corr) * cosd(this.nutation.eps) + cosd(this.B_corr) * sind(this.nutation.eps) * sind(this.apparentLongitude),
      );
    }
    return this._Dec;
  }

  get gmst() {
    if (this._GMST === undefined) {
      this._GMST = normalizeDegrees(
        280.46061837 + 360.98564736629 * (this.timeArgs.jd - 2451545) + this.timeArgs.t * this.timeArgs.t * (0.000387933 - this.timeArgs.t / 38710000),
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

  get equationOfTime() {
    if (this._equationOfTime === undefined) {
      let value = 4 * (this.gha + 180 - 15 * this.ut);
      if (value > 20) {
        value -= 1440;
      } else if (value < -20) {
        value += 1440;
      }
      this._equationOfTime = value;
    }
    return this._equationOfTime;
  }

  get semidiameter() {
    if (this._semidiameter === undefined) {
      this._semidiameter = 959.63 / this.earthState.radius / 60;
    }
    return this._semidiameter;
  }

  get horizontalParallax() {
    if (this._horizontalParallax === undefined) {
      this._horizontalParallax = 8.794 / this.earthState.radius / 60;
    }
    return this._horizontalParallax;
  }

  get distanceAu() {
    return this.earthState.radius;
  }
}

export function computeSolarPosition(j: number, ut: number, deltaT: number): SolarPositionResult {
  const engine = new SolarEphemeris(j, ut, deltaT);
  return {
    gmst: engine.gmst,
    gast: engine.gast,
    rightAscension: engine.rightAscension,
    declination: engine.declination,
    gha: engine.gha,
    sha: engine.sha,
    semidiameter: engine.semidiameter,
    horizontalParallax: engine.horizontalParallax,
    equationOfTime: engine.equationOfTime,
    distanceAu: engine.distanceAu,
    apparentLongitude: engine.apparentLongitude,
  };
}
