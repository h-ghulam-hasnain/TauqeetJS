import { asind, atand2, cosd, sind, tand } from '../../../internal/trig.js';
import { normalizeDegrees } from '../../../internal/angles.js';
import { timeArguments } from '../../time/JulianDate.js';
import { computeNutation } from '../../theories/nutation/iau2000b.js';
import { SolarEphemeris } from '../sun/SolarPosition.js';
import { elp2000SphericalOfDate } from '../../theories/elp2000/elp2000.js';
import type { LunarPositionResult } from '../../types/ephemeris.js';

export class LunarEphemeris {
  private _timeArguments?: { jd: number; jde: number; t: number; te: number; tau: number };
  private _nutation?: ReturnType<typeof computeNutation>;
  private _lambdaMoon?: number;
  private _lambdaMoonApparent?: number;
  private _betaMoon?: number;
  private _distanceKm?: number;
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

  constructor(
    readonly j: number,
    readonly ut: number,
    readonly deltaT: number
  ) {}

  private get timeArgs() {
    if (!this._timeArguments) {
      this._timeArguments = timeArguments(this.j, this.ut, this.deltaT);
    }
    return this._timeArguments;
  }

  private get nutation() {
    if (!this._nutation) {
      this._nutation = computeNutation(this.timeArgs.jd, this.ut, this.deltaT);
    }
    return this._nutation;
  }

  private ensureCoords() {
    if (this._lambdaMoon !== undefined && this._betaMoon !== undefined && this._distanceKm !== undefined) {
      return;
    }
    const coords = this.computeHighPrecisionCoords();
    this._lambdaMoon = coords.lambda;
    this._betaMoon = coords.beta;
    this._distanceKm = coords.distanceKm;
  }

  get lambdaMoon() {
    this.ensureCoords();
    return this._lambdaMoon!;
  }

  get betaMoon() {
    this.ensureCoords();
    return this._betaMoon!;
  }

  get distanceKm() {
    this.ensureCoords();
    return this._distanceKm!;
  }

  get lambdaMoonApparent() {
    if (this._lambdaMoonApparent === undefined) {
      this._lambdaMoonApparent = this.lambdaMoon + this.nutation.deltaPsi;
    }
    return this._lambdaMoonApparent;
  }

  get rightAscension() {
    if (this._RA === undefined) {
      this._RA = normalizeDegrees(
        atand2(
          sind(this.lambdaMoonApparent) * cosd(this.nutation.eps) -
            tand(this.betaMoon) * sind(this.nutation.eps),
          cosd(this.lambdaMoonApparent)
        )
      );
    }
    return this._RA;
  }

  get declination() {
    if (this._Dec === undefined) {
      this._Dec = asind(
        sind(this.betaMoon) * cosd(this.nutation.eps) +
          cosd(this.betaMoon) * sind(this.nutation.eps) * sind(this.lambdaMoonApparent)
      );
    }
    return this._Dec;
  }

  get gmst() {
    if (this._GMST === undefined) {
      this._GMST = normalizeDegrees(
        280.46061837 +
          360.98564736629 * (this.timeArgs.jd - 2451545) +
          this.timeArgs.t * this.timeArgs.t * (0.000387933 - this.timeArgs.t / 38710000)
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
      // IAU 2015 Earth equatorial radius: 6378.137 km
      // Result is in ARCSECONDS (multiply asind() by 3600)
      this._HPMoon = asind(6378.137 / this.distanceKm) * 3600;
    }
    return this._HPMoon;
  }

  get semidiameter() {
    if (this._SDMoon === undefined) {
      // IAU 2015 Moon mean radius: 1737.4 km
      // Result is in ARCSECONDS (multiply asind() by 3600)
      this._SDMoon = asind(1737.4 / this.distanceKm) * 3600;
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
      const kPercent = (100 * (1 - cosI)) / 2;
      this._illuminationFraction = Math.round(kPercent * 10) / 10 / 100;
    }
    return this._illuminationFraction;
  }

  get apparentLongitude() {
    return this.lambdaMoonApparent;
  }

  private computeHighPrecisionCoords(): { lambda: number; beta: number; distanceKm: number } {
    const coords = elp2000SphericalOfDate(this.timeArgs.jde);
    const te = this.timeArgs.te;
    const pA = (5029.0966 * te + 1.11161 * te * te - 0.000113 * te * te * te) / 3600;
    return {
      lambda: normalizeDegrees(coords.longitude + pA),
      beta: coords.latitude,
      distanceKm: coords.distanceKm
    };
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
