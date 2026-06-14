import { cosd } from '../../../internal/trig.js';
import { normalizeDegrees } from '../../../internal/angles.js';
import type { SolarEphemeris } from '../sun/SolarPosition.js';
import type { LunarEphemeris } from './LunarPosition.js';

/**
 * Internal lunar phase engine.
 * Computes instantaneous phase quantities and caches intermediate values.
 * 
 * Provides:
 * - Public: elongation, illuminatedFraction
 * - Internal: phase angle, geocentric separation, and other phase intermediates
 * 
 * This engine is designed to support future moon visibility algorithms
 * and Hijri calendar calculations without redundant recalculations.
 */
export class LunarPhaseEngine {
  private _elongation?: number;
  private _illuminatedFraction?: number;
  private _phaseAngle?: number;
  private _geocentricSeparation?: number;

  constructor(
    readonly solarEngine: SolarEphemeris,
    readonly lunarEngine: LunarEphemeris,
  ) {}

  /**
   * Lunar elongation: angular distance between Sun and Moon (0-360°).
   * 0° = New Moon (conjunction), 180° = Full Moon (opposition).
   */
  get elongation(): number {
    if (this._elongation === undefined) {
      const sunLambda = this.solarEngine.apparentLongitude;
      const moonLambda = this.lunarEngine.apparentLongitude;
      this._elongation = normalizeDegrees(moonLambda - sunLambda);
    }
    return this._elongation;
  }

  /**
   * Illuminated fraction of the Moon's disk (0-1).
   * 
   * Uses the standard formula: k = (1 - cos(elongation)) / 2
   * where elongation is folded to [0°, 180°].
   * 
   * - 0° elongation (New Moon)  → k = (1 - cos(0°))   / 2 = 0.0  (0%)
   * - 90° elongation (Quarter)  → k = (1 - cos(90°))  / 2 = 0.5  (50%)
   * - 180° elongation (Full)    → k = (1 - cos(180°)) / 2 = 1.0  (100%)
   */
  get illuminatedFraction(): number {
    if (this._illuminatedFraction === undefined) {
      // Fold elongation from [0°, 360°] → [0°, 180°] so the formula works
      // for both waxing (0–180) and waning (180–360) halves.
      const el = this.elongation;
      const angle = el > 180 ? 360 - el : el;
      const angleRad = (angle * Math.PI) / 180;
      this._illuminatedFraction = (1 - Math.cos(angleRad)) / 2;
    }
    return this._illuminatedFraction;
  }

  /**
   * Internal: Phase angle (degrees), [0°, 180°].
   * Defined as the elongation folded into the half-circle used for illumination.
   * 0° = New Moon, 180° = Full Moon.
   */
  private get phaseAngle(): number {
    if (this._phaseAngle === undefined) {
      const el = this.elongation;
      this._phaseAngle = el > 180 ? 360 - el : el;
    }
    return this._phaseAngle;
  }

  /**
   * Internal: Geocentric angular separation between Sun and Moon (radians).
   * Used for visibility and phase calculations.
   */
  get geocentricSeparation(): number {
    if (this._geocentricSeparation === undefined) {
      this._geocentricSeparation = this.phaseAngle; // Same as phase angle
    }
    return this._geocentricSeparation;
  }

  /**
   * Exposes lunar ephemeris values for visibility calculations.
   */
  get moonEphemeris() {
    return {
      rightAscension: this.lunarEngine.rightAscension,
      declination: this.lunarEngine.declination,
      gha: this.lunarEngine.gha,
      sha: this.lunarEngine.sha,
      horizontalParallax: this.lunarEngine.horizontalParallax,
      semidiameter: this.lunarEngine.semidiameter,
      distanceKm: this.lunarEngine.distanceKm,
      apparentLongitude: this.lunarEngine.apparentLongitude,
    };
  }

  /**
   * Exposes solar ephemeris values for visibility calculations.
   */
  get sunEphemeris() {
    return {
      rightAscension: this.solarEngine.rightAscension,
      declination: this.solarEngine.declination,
      gha: this.solarEngine.gha,
      sha: this.solarEngine.sha,
      horizontalParallax: this.solarEngine.horizontalParallax,
      semidiameter: this.solarEngine.semidiameter,
      distanceAu: this.solarEngine.distanceAu,
      apparentLongitude: this.solarEngine.apparentLongitude,
    };
  }
}
