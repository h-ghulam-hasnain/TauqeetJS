import { acosd, sind, cosd, tand, atan2d } from '../internal/math.js';
import { getJulianDate } from '../internal/time.js';
import { calculateNutation } from '../internal/nutation.js';
import { calculateSolar, SolarResult } from '../internal/solar.js';
import { getRefraction } from '../internal/refraction.js';
import { Coordinates } from './types/index.js';

/**
 * Internal helper to convert UTC hours to a Date object.
 */
export const toDate = (baseDate: Date, utcHours: number): Date => {
  const d = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0));
  if (isNaN(utcHours)) return new Date(NaN);
  const totalSeconds = Math.round(utcHours * 3600);
  d.setUTCSeconds(totalSeconds);
  return d;
};

/**
 * Internal helper to get solar ephemeris at a specific date.
 */
export const getSolarAt = (date: Date): { solar: SolarResult, jd: number } => {
  const jd = getJulianDate(date);
  const dt = 70; // Fixed ΔT as requested in original logic
  const jde = jd + dt / 86400;
  const te = (jde - 2451545) / 36525;
  const t = (jd - 2451545) / 36525;
  const tau = 0.1 * te;
  const nut = calculateNutation(te);
  const solar = calculateSolar(jd, nut.deltaPsi, nut.eps, te, tau, t);
  return { solar, jd };
};

/**
 * Solves for solar transit (Noon).
 */
export const calculateTransit = (date: Date, longitude: number): { time: Date; DEC: number; EOT: number; SD: number; iterations: number } => {
  let currentUtcTime = 12 - (longitude / 15);
  let lastSolar: SolarResult | undefined;
  let iterations = 0;
  
  for (let i = 0; i < 3; i++) {
    iterations++;
    const checkDate = toDate(date, currentUtcTime);
    const { solar } = getSolarAt(checkDate);
    const newUtcTime = 12 - (longitude / 15) - (solar.EOT / 60);
    
    if (Math.abs(newUtcTime - currentUtcTime) * 3600 < 0.1) {
      currentUtcTime = newUtcTime;
      lastSolar = solar;
      break;
    }
    currentUtcTime = newUtcTime;
    lastSolar = solar;
  }
  
  return { 
    time: toDate(date, currentUtcTime), 
    DEC: lastSolar?.DEC ?? 0, 
    EOT: lastSolar?.EOT ?? 0,
    SD: lastSolar?.SD ?? 0,
    iterations
  };
};

/**
 * Solves iteratively for a target zenith angle.
 */
export const solveIteratively = (
  date: Date, 
  coords: Coordinates, 
  angleBelowHorizon: number, 
  side: 'morning' | 'evening'
): { time: Date; DEC: number; EOT: number; iterations: number } => {
  let prevTime = side === 'morning' ? 6 : 18;
  let currentUtcTime = prevTime;
  let lastSolar: SolarResult | undefined;
  let iterations = 0;

  for (let i = 0; i < 5; i++) {
    iterations++;
    const checkDate = toDate(date, currentUtcTime);
    const { solar } = getSolarAt(checkDate);
    lastSolar = solar;
    const denominator = cosd(coords.latitude) * cosd(solar.DEC);

    if (Math.abs(denominator) < 1e-10) return { time: new Date(NaN), DEC: 0, EOT: 0, iterations };

    const cosH = (sind(-angleBelowHorizon) - sind(coords.latitude) * sind(solar.DEC)) / denominator;
    if (cosH > 1 || cosH < -1) return { time: new Date(NaN), DEC: 0, EOT: 0, iterations };

    const H = acosd(cosH) / 15;
    const transit = 12 - (coords.longitude / 15) - (solar.EOT / 60);
    currentUtcTime = side === 'morning' ? transit - H : transit + H;

    if (Math.abs(currentUtcTime - prevTime) * 3600 < 0.1) break;
    prevTime = currentUtcTime;
  }
  return { 
    time: toDate(date, currentUtcTime), 
    DEC: lastSolar?.DEC ?? 0, 
    EOT: lastSolar?.EOT ?? 0,
    iterations
  };
};

/**
 * Solves iteratively for Sunrise/Maghrib (with refraction and SD).
 */
export const solvePhenomenonIteratively = (
  date: Date, 
  coords: Coordinates, 
  side: 'morning' | 'evening'
): { time: Date; DEC: number; EOT: number; HP: number; SD: number; iterations: number } => {
  let prevTime = side === 'morning' ? 6 : 18;
  let currentUtcTime = prevTime;
  let lastSolar: SolarResult | undefined;
  let iterations = 0;

  for (let i = 0; i < 5; i++) {
    iterations++;
    const checkDate = toDate(date, currentUtcTime);
    const { solar } = getSolarAt(checkDate);
    lastSolar = solar;
    const refraction = 34 / 60;
    const sd_deg = solar.SD / 3600;
    const hp_deg = solar.HP / 3600;
    const elevation = coords.elevation || 0;
    const dip = 0.02933333 * Math.sqrt(elevation);

    const targetZenith = 90 + refraction + sd_deg - hp_deg + dip;
    const denominator = cosd(coords.latitude) * cosd(solar.DEC);

    if (Math.abs(denominator) < 1e-10) return { time: new Date(NaN), DEC: 0, EOT: 0, HP: 0, SD: 0, iterations };

    const cosH = (cosd(targetZenith) - sind(coords.latitude) * sind(solar.DEC)) / denominator;
    if (cosH > 1 || cosH < -1) return { time: new Date(NaN), DEC: 0, EOT: 0, HP: 0, SD: 0, iterations };

    const H = acosd(cosH) / 15;
    const transit = 12 - (coords.longitude / 15) - (solar.EOT / 60);
    currentUtcTime = side === 'morning' ? transit - H : transit + H;

    if (Math.abs(currentUtcTime - prevTime) * 3600 < 0.1) break;
    prevTime = currentUtcTime;
  }
  return { 
    time: toDate(date, currentUtcTime), 
    DEC: lastSolar?.DEC ?? 0, 
    EOT: lastSolar?.EOT ?? 0,
    HP: lastSolar?.HP ?? 0,
    SD: lastSolar?.SD ?? 0,
    iterations
  };
};

/**
 * Solves iteratively for Asr.
 */
export const solveAsrIteratively = (
  date: Date, 
  coords: Coordinates, 
  factor: number, 
  solarZuhr: { DEC: number; SD: number }, 
  temperature: number, 
  pressureMbar: number
): { time: Date; DEC: number; EOT: number; HP: number; SD: number; asrAngle: number; iterations: number } => {
  const zZuhr = Math.abs(coords.latitude - solarZuhr.DEC);
  const sdZuhr = solarZuhr.SD / 3600;
  const refrZuhr = getRefraction(90 - zZuhr, temperature, pressureMbar) / 60;
  const zZuhrVisual = zZuhr - refrZuhr - sdZuhr;

  let prevTime = 15;
  let currentUtcTime = prevTime;
  let lastSolar: SolarResult | undefined;
  let lastAsrAngle = 0;
  let iterations = 0;

  for (let i = 0; i < 5; i++) {
    iterations++;
    const checkDate = toDate(date, currentUtcTime);
    const { solar } = getSolarAt(checkDate);
    lastSolar = solar;
    const zAsrVisual = atan2d(tand(zZuhrVisual) + factor, 1);
    lastAsrAngle = zAsrVisual;
    const refrAsr = getRefraction(90 - zAsrVisual, temperature, pressureMbar) / 60;
    const sdAsr = solar.SD / 3600;
    const targetZenith = zAsrVisual + refrAsr + sdAsr;

    const denominator = cosd(coords.latitude) * cosd(solar.DEC);
    if (Math.abs(denominator) < 1e-10) return { time: new Date(NaN), DEC: 0, EOT: 0, HP: 0, SD: 0, asrAngle: 0, iterations };

    const cosH = (cosd(targetZenith) - sind(coords.latitude) * sind(solar.DEC)) / denominator;
    if (cosH > 1 || cosH < -1) return { time: new Date(NaN), DEC: 0, EOT: 0, HP: 0, SD: 0, asrAngle: 0, iterations };

    const H = acosd(cosH) / 15;
    const transit = 12 - (coords.longitude / 15) - (solar.EOT / 60);
    currentUtcTime = transit + H;

    if (Math.abs(currentUtcTime - prevTime) * 3600 < 0.1) break;
    prevTime = currentUtcTime;
  }
  return { 
    time: toDate(date, currentUtcTime), 
    DEC: lastSolar?.DEC ?? 0, 
    EOT: lastSolar?.EOT ?? 0,
    HP: lastSolar?.HP ?? 0,
    SD: lastSolar?.SD ?? 0,
    asrAngle: lastAsrAngle,
    iterations
  };
};
