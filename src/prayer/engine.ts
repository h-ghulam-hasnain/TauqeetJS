/**
 * Core Prayer Time Engine.
 * Following strictly defined Successive Approximation Algorithmic Workflow.
 */
import { acosd, sind, cosd, tand, atan2d } from '../core/math.js';
import { getRefraction } from '../astronomy/refraction.js';
import { getJulianDate } from '../core/time.js';
import { calculateNutation } from '../algorithms/nutation.js';
import { calculateSolar, SolarResult } from '../algorithms/solar.js';
import { Coordinates, CalculationMethod, PRESETS, PrayerTimesResult } from './types.js';

export class PrayerEngine {
  constructor(
    private coords: Coordinates,
    private method: CalculationMethod = 'Karachi'
  ) { }

  public calculate(date: Date, asrFactor: number = 2, temperature: number = 10, pressureMbar: number = 1010.0): PrayerTimesResult {


    // 1. Initial Transit (High-precision Solar Noon)
    const dhuhr = this.calculateTransit(date);


    // 2. Convergence-based iterative solving
    const params = PRESETS[this.method];

    // Fajr
    const fajr = this.solveIteratively(date, params.fajrAngle, 'morning');


    // Sunrise
    const sunrise = this.solvePhenomenonIteratively(date, 'morning');


    // Maghrib
    const maghrib = params.maghribInterval
      ? new Date(sunrise.getTime() + params.maghribInterval * 60000)
      : params.maghribAngle
        ? this.solveIteratively(date, params.maghribAngle, 'evening')
        : this.solvePhenomenonIteratively(date, 'evening');


    // Isha
    const isha = params.ishaInterval
      ? new Date(maghrib.getTime() + params.ishaInterval * 60000)
      : this.solveIteratively(date, params.ishaAngle || 18, 'evening');


    // Asr (Refined Scientific Calculation)
    const asr = this.solveAsrIteratively(date, asrFactor, dhuhr, temperature, pressureMbar);


    // Dhahwa Kubra
    const dhahwaKubra = new Date((fajr.getTime() + maghrib.getTime()) / 2);


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

  private getSolarAt(date: Date): { solar: SolarResult, jd: number } {
    const jd = getJulianDate(date);
    const dt = 70; // Fixed ΔT as requested
    const jde = jd + dt / 86400;
    const t = (jd - 2451545) / 36525;
    const te = (jde - 2451545) / 36525;
    const tau = 0.1 * te;
    const nut = calculateNutation(te);
    const solar = calculateSolar(jd, nut.deltaPsi, nut.eps, te, tau, t);
    
    // Detailed log to match script.js

    
    return { solar, jd };
  }

  private calculateTransit(date: Date): Date {
    // Initial guess: Noon UTC
    let currentUtcTime = 12 - (this.coords.longitude / 15);

    for (let i = 0; i < 3; i++) {
      const checkDate = this.toDate(date, currentUtcTime);
      const { solar } = this.getSolarAt(checkDate);
      currentUtcTime = 12 - (this.coords.longitude / 15) - (solar.EOT / 60);
    }

    return this.toDate(date, currentUtcTime);
  }

  /**
   * Successive Approximation loop for target Zenith angle.
   * Stops when refinement is < 1 second.
   */
  private solveIteratively(date: Date, angleBelowHorizon: number, side: 'morning' | 'evening'): Date {
    let prevTime = side === 'morning' ? 6 : 18;
    let currentUtcTime = prevTime;

    const MAX_ITER = 5;
    for (let i = 0; i < MAX_ITER; i++) {
      const checkDate = this.toDate(date, currentUtcTime);
      const { solar } = this.getSolarAt(checkDate);

      const denominator = cosd(this.coords.latitude) * cosd(solar.DEC);
      
      // Prevent division by zero at poles
      if (Math.abs(denominator) < 1e-10) {
        return new Date(NaN);
      }

      const cosH = (sind(-angleBelowHorizon) - sind(this.coords.latitude) * sind(solar.DEC)) / denominator;

      if (cosH > 1 || cosH < -1) return new Date(NaN);

      const H = acosd(cosH) / 15;
      const transit = 12 - (this.coords.longitude / 15) - (solar.EOT / 60);
      currentUtcTime = side === 'morning' ? transit - H : transit + H;

      // Convergence check: diff < 1 second
      if (Math.abs(currentUtcTime - prevTime) * 3600 < 1) break;
      prevTime = currentUtcTime;
    }

    return this.toDate(date, currentUtcTime);
  }

  /**
   * Successive Approximation for Sunrise/Maghrib.
   * Formula: 90 + 34' (Refraction) + SD - HP
   */
  private solvePhenomenonIteratively(date: Date, side: 'morning' | 'evening'): Date {
    let prevTime = side === 'morning' ? 6 : 18;
    let currentUtcTime = prevTime;

    for (let i = 0; i < 5; i++) {
      const checkDate = this.toDate(date, currentUtcTime);
      const { solar } = this.getSolarAt(checkDate);

      // Dynamic angle calculation per iteration
      const refraction = 34 / 60; // 34 arcminutes in degrees
      const sd_deg = solar.SD / 3600;
      const hp_deg = solar.HP / 3600;
      
      // Altitude Dip: horizon drops as altitude increases
      const elevation = this.coords.elevation || 0;
      const dip = 0.02933333 * Math.sqrt(elevation);
      
      const targetZenith = 90 + refraction + sd_deg - hp_deg + dip;

      const denominator = cosd(this.coords.latitude) * cosd(solar.DEC);
      
      if (Math.abs(denominator) < 1e-10) {
        return new Date(NaN);
      }

      const cosH = (cosd(targetZenith) - sind(this.coords.latitude) * sind(solar.DEC)) / denominator;

      if (cosH > 1 || cosH < -1) return new Date(NaN);

      const H = acosd(cosH) / 15;
      const transit = 12 - (this.coords.longitude / 15) - (solar.EOT / 60);
      currentUtcTime = side === 'morning' ? transit - H : transit + H;

      if (Math.abs(currentUtcTime - prevTime) * 3600 < 1) break;
      prevTime = currentUtcTime;
    }

    return this.toDate(date, currentUtcTime);
  }

  /**
   * Accounts for Solar Semi-Diameter and Refraction at both Noon and Asr.
   */
  private solveAsrIteratively(date: Date, factor: number, dhuhr: Date, temperature: number = 10, pressureMbar: number = 1010.0): Date {
    // 1. True Zenith at Zuhr
    const { solar: solarZuhr } = this.getSolarAt(dhuhr);
    const zZuhr = Math.abs(this.coords.latitude - solarZuhr.DEC);

    // 2. Apparent Visual Start (Upper-limb position)
    const sdZuhr = solarZuhr.SD / 3600;
    const refrZuhr = getRefraction(90 - zZuhr, temperature, pressureMbar) / 60;
    const zZuhrVisual = zZuhr - refrZuhr - sdZuhr;

    let prevTime = 15;
    let currentUtcTime = prevTime;

    for (let i = 0; i < 5; i++) {
      const checkDate = this.toDate(date, currentUtcTime);
      const { solar } = this.getSolarAt(checkDate);

      // 3. Asr Shadow Addition (Visual)
      const zAsrVisual = atan2d(tand(zZuhrVisual) + factor, 1);

      // 4. True Geometric Asr (Center of sun)
      const refrAsr = getRefraction(90 - zAsrVisual, temperature, pressureMbar) / 60;
      const sdAsr = solar.SD / 3600;
      const targetZenith = zAsrVisual + refrAsr + sdAsr;

      // 5. Final Output using Spherical Trigonometry
      const denominator = cosd(this.coords.latitude) * cosd(solar.DEC);
      
      if (Math.abs(denominator) < 1e-10) {
        return new Date(NaN);
      }

      const cosH = (cosd(targetZenith) - sind(this.coords.latitude) * sind(solar.DEC)) / denominator;

      if (cosH > 1 || cosH < -1) return new Date(NaN);

      const H = acosd(cosH) / 15;
      const transit = 12 - (this.coords.longitude / 15) - (solar.EOT / 60);
      currentUtcTime = transit + H;

      if (Math.abs(currentUtcTime - prevTime) * 3600 < 1) break;
      prevTime = currentUtcTime;
    }

    return this.toDate(date, currentUtcTime);
  }

  private toDate(baseDate: Date, utcHours: number): Date {
    const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0));
    const totalSeconds = Math.round(utcHours * 3600);
    d.setUTCSeconds(totalSeconds);
    return d;
  }
}
