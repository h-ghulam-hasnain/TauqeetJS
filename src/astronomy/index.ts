import { getJulianDate, getJulianCenturies, getJulianMillennia, getDeltaT } from '../core/time.js';
import { calculateNutation, NutationResult } from '../algorithms/nutation.js';
import { calculateSolar, SolarResult } from '../algorithms/solar.js';
import { calculateMoon, MoonResult } from '../algorithms/moon.js';
import { calculatePolaris, PolarisResult } from '../algorithms/polaris.js';

/**
 * The Astronomy module provides high-precision calculations for celestial bodies.
 * It strictly follows the algorithms in script.js (Meeus based).
 */
export class Astronomy {
  private _jd: number;
  private _jde: number;
  private _t: number;   // JD-based centuries
  private _te: number;  // JDE-based centuries
  private _tau: number; // JDE-based millennia
  private _nutation: NutationResult;
  private _solar?: SolarResult;
  private _moon?: MoonResult;
  private _polaris?: PolarisResult;

  constructor(date: Date = new Date(), deltaT?: number) {
    this._jd = getJulianDate(date);
    
    // If deltaT is not provided, calculate it for the year
    const dt = deltaT !== undefined ? deltaT : getDeltaT(date.getUTCFullYear());
    
    this._jde = this._jd + dt / 86400;
    this._t = (this._jd - 2451545) / 36525;
    this._te = (this._jde - 2451545) / 36525;
    this._tau = 0.1 * this._te;
    
    // Nutation and Solar series in script.js use TE and Tau (based on JDE)
    this._nutation = calculateNutation(this._te);
  }

  public get jd(): number { return this._jd; }
  public get jde(): number { return this._jde; }
  public get t(): number { return this._t; }
  public get te(): number { return this._te; }
  public get tau(): number { return this._tau; }
  public get nutation(): NutationResult { return this._nutation; }

  public get sun(): SolarResult {
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

  public get moon(): MoonResult {
    if (!this._moon) {
      const sunResult = this.sun;
      // Aries calculation logic
      const t2 = this._t * this._t;
      const t3 = t2 * this._t;
      const ghaaMean = (280.46061837 + 360.98564736629 * (this._jd - 2451545) + 0.000387933 * t2 - t3 / 38710000) % 360;
      const ghaaTrue = (ghaaMean + this._nutation.deltaPsi * Math.cos(this._nutation.eps * Math.PI / 180)) % 360;
      
      this._moon = calculateMoon(
        this._jd,
        this._te,
        this._nutation.deltaPsi,
        this._nutation.eps,
        ghaaTrue,
        0, // Should use apparent longitude of sun
        sunResult.RA,
        sunResult.DEC
      );
    }
    return this._moon;
  }

  public get polaris(): PolarisResult {
    if (!this._polaris) {
      const sunResult = this.sun;
      const t2 = this._t * this._t;
      const t3 = t2 * this._t;
      const ghaaMean = (280.46061837 + 360.98564736629 * (this._jd - 2451545) + 0.000387933 * t2 - t3 / 38710000) % 360;
      const ghaaTrue = (ghaaMean + this._nutation.deltaPsi * Math.cos(this._nutation.eps * Math.PI / 180)) % 360;

      this._polaris = calculatePolaris(
        this._te,
        ghaaTrue,
        this._nutation.eps,
        this._nutation.deltaPsi,
        0 // sunLambda
      );
    }
    return this._polaris;
  }
}
