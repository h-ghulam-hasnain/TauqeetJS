import { computeSolarPosition, dateToJulianDay, calculateDeltaT } from '../astronomy/index.js';

export interface SolarEphemeris {
  readonly declination: number; // degrees
  readonly equationOfTime: number; // minutes
  readonly semidiameter: number; // degrees
  readonly horizontalParallax: number; // degrees
}

export class EphemerisService {
  private static instance: EphemerisService | null = null;

  // Cache stores pre-sampled points for a julianDay (start of day)
  private readonly solarCache = new Map<number, SolarEphemeris[]>();
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
   * Pre-samples solar ephemeris for a given day at 13 points (every 2 hours).
   * Samples span -2h to +26h to safely support iterative solver probes
   * that drift slightly outside the [0, 24] range.
   */
  private getOrComputeDaySamples(jdStart: number, year: number): SolarEphemeris[] {
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
    const samples: SolarEphemeris[] = [];

    // 15 points: -2h, 0h, 2h, ... 24h, 26h  (every 2 hours)
    // Spans -2 to +26 to handle solver probes outside [0,24]
    for (let h = -2; h <= 26; h += 2) {
      const pos = computeSolarPosition(jdStart, h, deltaT);
      samples.push({
        declination: pos.declination,
        equationOfTime: pos.equationOfTime,
        semidiameter: pos.semidiameter,
        horizontalParallax: pos.horizontalParallax,
      });
    }

    this.solarCache.set(jdStart, samples);
    this.cacheKeys.push(jdStart);
    return samples;
  }

  /**
   * Evaluates solar ephemeris at a given UTC hour on a specific prayer day.
   *
   * @param utcHours   The UTC hour to evaluate (may be negative or >24 during
   *                   iterative solver convergence — will be clamped internally).
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

    const samples = this.getOrComputeDaySamples(jdStart, year);

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
      declination: this.interpolate(ut, samples),
      equationOfTime: this.interpolate(ut, samples, 'equationOfTime'),
      semidiameter: this.interpolate(ut, samples, 'semidiameter'),
      horizontalParallax: this.interpolate(ut, samples, 'horizontalParallax'),
    };
  }

  /**
   * Lagrange 3-point interpolation over 15 samples spanning -2h to +26h.
   * Sample index i corresponds to hour = i*2 - 2.
   */
  private interpolate(
    ut: number,
    samples: SolarEphemeris[],
    key: keyof SolarEphemeris = 'declination'
  ): number {
    // samples[0] = -2h, samples[1] = 0h, ..., samples[14] = 26h
    // Convert ut to fractional index in this extended array
    // hour = i*2 - 2  =>  i = (hour + 2) / 2
    const fracIdx = (ut + 2) / 2;

    // Pick the bracket: p2 is the floor of fracIdx, clamped to [1, length-2]
    const p2 = Math.min(Math.max(Math.floor(fracIdx), 1), samples.length - 2);
    const p1 = p2 - 1;
    const p3 = p2 + 1;

    // Guard: if any index is out of range, fall back to nearest sample value
    if (p1 < 0 || p3 >= samples.length) {
      const clamped = Math.min(Math.max(Math.round(fracIdx), 0), samples.length - 1);
      return samples[clamped]![key];
    }

    const x1 = p1 * 2 - 2; // actual hour of sample p1
    const x2 = p2 * 2 - 2; // actual hour of sample p2
    const x3 = p3 * 2 - 2; // actual hour of sample p3

    const y1 = samples[p1]![key];
    const y2 = samples[p2]![key];
    const y3 = samples[p3]![key];

    const term1 = (y1 * ((ut - x2) * (ut - x3))) / ((x1 - x2) * (x1 - x3));
    const term2 = (y2 * ((ut - x1) * (ut - x3))) / ((x2 - x1) * (x2 - x3));
    const term3 = (y3 * ((ut - x1) * (ut - x2))) / ((x3 - x1) * (x3 - x2));

    return term1 + term2 + term3;
  }
}

export const ephemerisService = EphemerisService.getInstance();
