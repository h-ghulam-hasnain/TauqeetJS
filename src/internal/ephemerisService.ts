import { computeSolarPosition } from '../astronomy/bodies/sun/SolarEphemeris.js';
import { calculateDeltaT } from '../astronomy/time/DeltaT.js';
import { dateToJulianDay } from '../astronomy/time/JulianDate.js';
import { ChebyshevInterpolator } from './interpolation.js';

export interface SolarEphemeris {
  readonly declination: number; // degrees
  readonly equationOfTime: number; // minutes
  readonly semidiameter: number; // degrees
  readonly horizontalParallax: number; // degrees
}

export interface SolarInterpolators {
  readonly declination: ChebyshevInterpolator;
  readonly equationOfTime: ChebyshevInterpolator;
  readonly semidiameter: ChebyshevInterpolator;
  readonly horizontalParallax: ChebyshevInterpolator;
}

export class EphemerisService {
  private static instance: EphemerisService | null = null;

  // Cache stores Chebyshev interpolators for a julianDay (start of day)
  private readonly solarCache = new Map<number, SolarInterpolators>();
  private readonly cacheKeys: number[] = [];
  private readonly MAX_CACHE_SIZE = 10;

  private constructor() {}

  public static getInstance(): EphemerisService {
    if (!this.instance) {
      this.instance = new EphemerisService();
    }
    return this.instance;
  }

  /**
   * Pre-samples solar ephemeris at Chebyshev nodes and creates interpolators.
   */
  private getOrComputeDayInterpolators(jdStart: number, year: number): SolarInterpolators {
    if (this.solarCache.has(jdStart)) {
      return this.solarCache.get(jdStart)!;
    }

    // Evict oldest if cache is full
    if (this.solarCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cacheKeys.shift();
      if (oldestKey !== undefined) {
        this.solarCache.delete(oldestKey);
      }
    }

    const deltaT = calculateDeltaT(year);
    const a = -2;
    const b = 26;
    const n = 8; // 8 Chebyshev nodes for optimal precision/performance

    const declinationSamples: number[] = [];
    const eotSamples: number[] = [];
    const sdSamples: number[] = [];
    const hpSamples: number[] = [];

    for (let k = 1; k <= n; k++) {
      const nodeNormalized = Math.cos(((2 * k - 1) / (2 * n)) * Math.PI);
      const h = ((b - a) / 2) * nodeNormalized + (a + b) / 2;
      const pos = computeSolarPosition(jdStart, h, deltaT);
      declinationSamples.push(pos.declination);
      eotSamples.push(pos.equationOfTime);
      sdSamples.push(pos.semidiameter);
      hpSamples.push(pos.horizontalParallax);
    }

    const interpolators: SolarInterpolators = {
      declination: new ChebyshevInterpolator(a, b, declinationSamples),
      equationOfTime: new ChebyshevInterpolator(a, b, eotSamples),
      semidiameter: new ChebyshevInterpolator(a, b, sdSamples),
      horizontalParallax: new ChebyshevInterpolator(a, b, hpSamples),
    };

    this.solarCache.set(jdStart, interpolators);
    this.cacheKeys.push(jdStart);
    return interpolators;
  }

  /**
   * Evaluates solar ephemeris at a given UTC hour on a specific prayer day.
   *
   * @param baseDateJd The Julian Day of the prayer day's midnight (anchor).
   *                   If omitted, falls back to deriving the JD from `date`.
   * @param date       Fallback Date object used only when baseDateJd is absent.
   */
  public getSolarEphemeris(date: Date, baseDateJd?: number): SolarEphemeris {
    // Always anchor to the prayer day, not whatever day the iterated Date falls on.
    let jdStart: number;
    let year: number;

    if (baseDateJd !== undefined) {
      jdStart = baseDateJd;
      // Recover year from JD (approx — only needed for deltaT)
      year = date.getUTCFullYear();
    } else {
      year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      jdStart = dateToJulianDay(year, month, day);
    }

    const interpolators = this.getOrComputeDayInterpolators(jdStart, year);

    // Compute continuous UT from the date object relative to jdStart
    const actualJd = dateToJulianDay(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate()
    );
    const dayDiff = actualJd - jdStart;

    const ut =
      dayDiff * 24 +
      date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600 +
      date.getUTCMilliseconds() / 3600000;

    return {
      declination: interpolators.declination.evaluate(ut),
      equationOfTime: interpolators.equationOfTime.evaluate(ut),
      semidiameter: interpolators.semidiameter.evaluate(ut),
      horizontalParallax: interpolators.horizontalParallax.evaluate(ut),
    };
  }
}

export const ephemerisService = EphemerisService.getInstance();
