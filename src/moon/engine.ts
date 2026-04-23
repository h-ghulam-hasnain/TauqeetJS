import { norm360, sind, cosd, acosd, norm24 } from '../core/math.js';
import { getJulianDate, getDeltaT } from '../core/time.js';
import { calculateNutation } from '../algorithms/nutation.js';
import { calculateSolar } from '../algorithms/solar.js';
import { calculateMoon, MoonResult } from '../algorithms/moon.js';
import { Coordinates } from '../prayer/types.js';

export interface MoonRiseSetResult {
  rise?: Date;
  set?: Date;
  transit?: Date;
}

export class MoonEngine {
  constructor(private coords: Coordinates) {}

  public calculate(date: Date): MoonRiseSetResult {
    // Initial guess: Transit at 12:00 local
    let transitUtc = 12 - (this.coords.longitude / 15);
    
    const transit = this.solveTransit(date, transitUtc);
    const rise = this.solveRiseSet(date, transit, 'rise');
    const set = this.solveRiseSet(date, transit, 'set');

    return { rise, set, transit };
  }

  private getMoonAt(date: Date): MoonResult {
    const jd = getJulianDate(date);
    const dt = getDeltaT(date.getUTCFullYear());
    const jde = jd + dt / 86400;
    const te = (jde - 2451545) / 36525;
    const t = (jd - 2451545) / 36525;
    const tau = 0.1 * te;
    const nut = calculateNutation(te);
    const solar = calculateSolar(jd, nut.deltaPsi, nut.eps, te, tau, t);
    
    // GHA True calculation
    const t2 = t * t;
    const t3 = t2 * t;
    const ghaaMean = (280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * t2 - t3 / 38710000) % 360;
    const ghaaTrue = (ghaaMean + nut.deltaPsi * Math.cos(nut.eps * Math.PI / 180)) % 360;

    return calculateMoon(jd, te, nut.deltaPsi, nut.eps, ghaaTrue, solar.lambdaApp, solar.RA, solar.DEC);
  }

  private solveTransit(date: Date, initialUtc: number): Date {
    let currentUtc = initialUtc;
    for (let i = 0; i < 3; i++) {
        const checkDate = this.toDate(date, currentUtc);
        const moon = this.getMoonAt(checkDate);
        // Moon moves ~13 deg/day. We need to account for this motion in transit calculation.
        // Simplified: transit occurs when LHA = 0. LHA = GHA + Lng.
        // H = -LHA. H = -(GHA + Lng).
        let H = moon.GHA + this.coords.longitude;
        if (H > 180) H -= 360;
        if (H < -180) H += 360;
        currentUtc -= H / 15;
    }
    return this.toDate(date, currentUtc);
  }

  private solveRiseSet(date: Date, transit: Date, side: 'rise' | 'set'): Date {
    const transitUtc = transit.getUTCHours() + transit.getUTCMinutes() / 60 + transit.getUTCSeconds() / 3600;
    const h0 = -0.833; // User requested: Standard -0.833 for Moon Rise/Set
    
    let currentUtc = side === 'rise' ? (transitUtc - 6 + 24) % 24 : (transitUtc + 6 + 24) % 24;
    let prevUtc = currentUtc;

    for (let i = 0; i < 7; i++) { // Increased iterations for Moon
        const checkDate = this.toDate(date, currentUtc);
        const moon = this.getMoonAt(checkDate);
        
        const denominator = cosd(this.coords.latitude) * cosd(moon.DEC);
        if (Math.abs(denominator) < 1e-10) return new Date(NaN);

        const cosH = (sind(h0) - sind(this.coords.latitude) * sind(moon.DEC)) / denominator;
        
        // Handle circumpolar or never-rising moon
        if (cosH > 1 || cosH < -1) return new Date(NaN);

        const H = acosd(cosH) / 15;
        
        // Recalculate transit at current time to account for Moon's fast motion
        let LHA = moon.GHA + this.coords.longitude;
        if (LHA > 180) LHA -= 360;
        if (LHA < -180) LHA += 360;
        const localTransit = currentUtc + LHA / 15;

        currentUtc = side === 'rise' ? localTransit - H : localTransit + H;
        
        // Convergence check: diff < 0.1 second
        if (Math.abs(currentUtc - prevUtc) * 3600 < 0.1) break;
        prevUtc = currentUtc;
    }
    return this.toDate(date, currentUtc);
  }

  private toDate(baseDate: Date, utcHours: number): Date {
    const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0));
    d.setUTCSeconds(Math.round(utcHours * 3600));
    return d;
  }
}
