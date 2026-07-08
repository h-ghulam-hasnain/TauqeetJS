import { SolarEphemeris } from '../bodies/sun/SolarPosition.js';
import { LunarEphemeris } from '../bodies/moon/LunarPosition.js';
import { computeNutation } from '../theories/nutation/iau2000b.js';
import { calculateDeltaT } from '../time/DeltaT.js';
import { julianDayToDate } from '../time/JulianDate.js';
import { LunarEventFinder } from './LunarEventFinder.js';
import { computeHorizontalPosition } from './Visibility.js';
import type { GeographicPosition } from '../types/observer.js';
import type { EventTime } from '../types/phenomena.js';
import { SearchConvergenceError, InvalidArgumentError, OperationAbortedError } from '../errors.js';
import type { DiagnosticsConfig } from '../types/diagnostics.js';
export enum EclipseKind {
  Penumbral = 0,
  Partial = 1,
  Total = 2,
  Annular = 3,
}

export interface LunarEclipseInfo {
  readonly kind: EclipseKind;
  readonly obscuration: number;
  readonly peak: EventTime;
  readonly sdPenumbral: number; // semi-duration in minutes
  readonly sdPartial: number;   // semi-duration in minutes
  readonly sdTotal: number;     // semi-duration in minutes
}

export interface GlobalSolarEclipseInfo {
  readonly kind: EclipseKind;
  readonly obscuration?: number | undefined;
  readonly peak: EventTime;
  readonly distance: number; // shadow axis distance in km
  readonly latitude?: number | undefined; // geodetic latitude at peak
  readonly longitude?: number | undefined; // geodetic longitude at peak
}

export interface EclipseEvent {
  readonly time: EventTime;
  readonly altitude: number;
}

export interface LocalSolarEclipseInfo {
  readonly kind: EclipseKind;
  readonly obscuration: number;
  readonly partialBegin: EclipseEvent;
  readonly totalBegin?: EclipseEvent | undefined;
  readonly peak: EclipseEvent;
  readonly totalEnd?: EclipseEvent | undefined;
  readonly partialEnd: EclipseEvent;
}

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface ShadowInfo {
  timeJd: number;
  u: number;
  r: number;
  k: number;
  p: number;
  target: Vector3D;
  dir: Vector3D;
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const KM_PER_AU = 149597870.7;

const SUN_RADIUS_KM = 696340.0;
const SUN_RADIUS_AU = SUN_RADIUS_KM / KM_PER_AU;
const EARTH_MEAN_RADIUS_KM = 6371.0;
const EARTH_ATMOSPHERE_KM = 88.0;
const EARTH_ECLIPSE_RADIUS_KM = EARTH_MEAN_RADIUS_KM + EARTH_ATMOSPHERE_KM;
const MOON_MEAN_RADIUS_KM = 1737.4;
const MOON_POLAR_RADIUS_KM = 1736.0;
const MOON_POLAR_RADIUS_AU = MOON_POLAR_RADIUS_KM / KM_PER_AU;

const EARTH_FLATTENING = 0.996647180302104; // 1 - 1/298.257223563
const EARTH_FLATTENING_SQUARED = EARTH_FLATTENING * EARTH_FLATTENING;
const EARTH_EQUATORIAL_RADIUS_KM = 6378.137;

function eventTimeFromJd(julianDay: number): EventTime {
  const { year, month, day } = julianDayToDate(julianDay);
  let dayWhole = Math.trunc(day);
  const dayFraction = day - dayWhole;
  const ut = dayFraction * 24;
  let hour = Math.trunc(ut);
  let minute = Math.trunc((ut - hour) * 60);
  let second = Math.round(((ut - hour) * 60 - minute) * 60);

  if (second >= 60) {
    second = 0;
    minute += 1;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
      if (hour >= 24) {
        hour = 0;
        dayWhole += 1;
      }
    }
  }

  return { julianDay, ut, year, month, day: dayWhole, hour, minute, second };
}

function getSunVector(solar: SolarEphemeris): Vector3D {
  const r = solar.distanceAu;
  const lat = solar.apparentLatitude * DEG2RAD;
  const lon = solar.apparentLongitude * DEG2RAD;
  const cosLat = Math.cos(lat);
  return {
    x: r * cosLat * Math.cos(lon),
    y: r * cosLat * Math.sin(lon),
    z: r * Math.sin(lat),
  };
}

function getMoonVector(lunar: LunarEphemeris): Vector3D {
  const r = lunar.distanceKm / KM_PER_AU;
  const lat = lunar.betaMoon * DEG2RAD;
  const lon = lunar.lambdaMoonApparent * DEG2RAD;
  const cosLat = Math.cos(lat);
  return {
    x: r * cosLat * Math.cos(lon),
    y: r * cosLat * Math.sin(lon),
    z: r * Math.sin(lat),
  };
}

function eclToEquD(v: Vector3D, epsDeg: number): Vector3D {
  const eps = epsDeg * DEG2RAD;
  const cosE = Math.cos(eps);
  const sinE = Math.sin(eps);
  return {
    x: v.x,
    y: v.y * cosE - v.z * sinE,
    z: v.y * sinE + v.z * cosE,
  };
}

function angleBetween(a: Vector3D, b: Vector3D): number {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  const lenA = Math.hypot(a.x, a.y, a.z);
  const lenB = Math.hypot(b.x, b.y, b.z);
  if (lenA < 1e-8 || lenB < 1e-8) {
    throw new InvalidArgumentError('AngleBetween: vector too short.');
  }
  const cosAngle = dot / (lenA * lenB);
  if (cosAngle <= -1) return 180;
  if (cosAngle >= 1) return 0;
  return RAD2DEG * Math.acos(cosAngle);
}

function Obscuration(a: number, b: number, c: number): number {
  if (a <= 0.0) throw new InvalidArgumentError('Radius of first disc must be positive.');
  if (b <= 0.0) throw new InvalidArgumentError('Radius of second disc must be positive.');
  if (c < 0.0) throw new InvalidArgumentError('Distance between discs is not allowed to be negative.');

  if (c >= a + b) {
    return 0.0;
  }
  if (c === 0.0) {
    return a <= b ? 1.0 : (b * b) / (a * a);
  }
  const x = (a * a - b * b + c * c) / (2.0 * c);
  const radicand = a * a - x * x;
  if (radicand <= 0.0) {
    return a <= b ? 1.0 : (b * b) / (a * a);
  }
  const y = Math.sqrt(radicand);
  const lens1 = a * a * Math.acos(x / a) - x * y;
  const lens2 = b * b * Math.acos((c - x) / b) - (c - x) * y;
  return (lens1 + lens2) / (Math.PI * a * a);
}

function solarEclipseObscuration(hm: Vector3D, lo: Vector3D): number {
  const ho = { x: hm.x + lo.x, y: hm.y + lo.y, z: hm.z + lo.z };
  const lenHO = Math.hypot(ho.x, ho.y, ho.z);
  const lenLO = Math.hypot(lo.x, lo.y, lo.z);
  const sunRadius = Math.asin(SUN_RADIUS_AU / lenHO);
  const moonRadius = Math.asin(MOON_POLAR_RADIUS_AU / lenLO);
  const sunMoonSep = angleBetween(lo, ho);
  const obsc = Obscuration(sunRadius, moonRadius, sunMoonSep * DEG2RAD);
  return Math.min(0.9999, obsc);
}

function eclipseKindFromUmbra(k: number): EclipseKind {
  return k > 0.014 ? EclipseKind.Total : EclipseKind.Annular;
}

function calcShadow(bodyRadiusKm: number, jd: number, target: Vector3D, dir: Vector3D): ShadowInfo {
  const dirLen2 = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z;
  const u = (dir.x * target.x + dir.y * target.y + dir.z * target.z) / dirLen2;
  const dx = (u * dir.x) - target.x;
  const dy = (u * dir.y) - target.y;
  const dz = (u * dir.z) - target.z;
  const r = KM_PER_AU * Math.hypot(dx, dy, dz);
  const k = SUN_RADIUS_KM - (1.0 + u) * (SUN_RADIUS_KM - bodyRadiusKm);
  const p = -SUN_RADIUS_KM + (1.0 + u) * (SUN_RADIUS_KM + bodyRadiusKm);
  return { timeJd: jd, u, r, k, p, target, dir };
}

function getEarthShadow(jd: number, ut: number, deltaT: number): ShadowInfo {
  const solar = new SolarEphemeris(jd, ut, deltaT);
  const lunar = new LunarEphemeris(jd, ut, deltaT);
  const s = getSunVector(solar);
  const e = { x: -s.x, y: -s.y, z: -s.z };
  const m = getMoonVector(lunar);
  return calcShadow(EARTH_ECLIPSE_RADIUS_KM, jd + ut / 24, m, e);
}

function getMoonShadow(jd: number, ut: number, deltaT: number): ShadowInfo {
  const solar = new SolarEphemeris(jd, ut, deltaT);
  const lunar = new LunarEphemeris(jd, ut, deltaT);
  const s = getSunVector(solar);
  const m = getMoonVector(lunar);
  const e = { x: -m.x, y: -m.y, z: -m.z };
  const hm = { x: m.x - s.x, y: m.y - s.y, z: m.z - s.z };
  return calcShadow(MOON_MEAN_RADIUS_KM, jd + ut / 24, e, hm);
}

function getShadowSlope(jd: number, deltaT: number): number {
  const dt = 1.0 / 86400.0;
  const r1 = getEarthShadow(jd - dt, 0, deltaT).r;
  const r2 = getEarthShadow(jd + dt, 0, deltaT).r;
  return (r2 - r1) / dt;
}

function getMoonShadowSlope(jd: number, deltaT: number): number {
  const dt = 1.0 / 86400.0;
  const r1 = getMoonShadow(jd - dt, 0, deltaT).r;
  const r2 = getMoonShadow(jd + dt, 0, deltaT).r;
  return (r2 - r1) / dt;
}

function findPeakEarthShadow(fmJd: number, deltaT: number): ShadowInfo {
  let t0 = fmJd - 0.03;
  let t1 = fmJd + 0.03;
  let s0 = getShadowSlope(t0, deltaT);
  let s1 = getShadowSlope(t1, deltaT);
  if (Math.sign(s0) !== Math.sign(s1)) {
    for (let iter = 0; iter < 30; iter++) {
      const tmid = (t0 + t1) / 2;
      const smid = getShadowSlope(tmid, deltaT);
      if (Math.abs(smid) < 1e-8) {
        t0 = tmid;
        break;
      }
      if (Math.sign(smid) === Math.sign(s0)) {
        t0 = tmid;
        s0 = smid;
      } else {
        t1 = tmid;
        s1 = smid;
      }
    }
  }
  const peakJd = (t0 + t1) / 2;
  return getEarthShadow(peakJd, 0, deltaT);
}

function findPeakMoonShadow(nmJd: number, deltaT: number): ShadowInfo {
  let t0 = nmJd - 0.03;
  let t1 = nmJd + 0.03;
  let s0 = getMoonShadowSlope(t0, deltaT);
  let s1 = getMoonShadowSlope(t1, deltaT);
  if (Math.sign(s0) !== Math.sign(s1)) {
    for (let iter = 0; iter < 30; iter++) {
      const tmid = (t0 + t1) / 2;
      const smid = getMoonShadowSlope(tmid, deltaT);
      if (Math.abs(smid) < 1e-8) {
        t0 = tmid;
        break;
      }
      if (Math.sign(smid) === Math.sign(s0)) {
        t0 = tmid;
        s0 = smid;
      } else {
        t1 = tmid;
        s1 = smid;
      }
    }
  }
  const peakJd = (t0 + t1) / 2;
  return getMoonShadow(peakJd, 0, deltaT);
}

function getShadowSemiDuration(peakJd: number, radiusLimit: number, windowMinutes: number, deltaT: number): number {
  const windowDays = windowMinutes / 1440;
  
  // Search backward
  let left0 = peakJd - windowDays;
  let left1 = peakJd;
  let r_left0 = getEarthShadow(left0, 0, deltaT).r - radiusLimit;
  let r_left1 = getEarthShadow(left1, 0, deltaT).r - radiusLimit;
  if (r_left0 * r_left1 > 0) {
    return 0;
  }
  for (let iter = 0; iter < 24; iter++) {
    const mid = (left0 + left1) / 2;
    const r_mid = getEarthShadow(mid, 0, deltaT).r - radiusLimit;
    if (r_mid < 0) {
      left1 = mid;
    } else {
      left0 = mid;
    }
  }
  const jdStart = (left0 + left1) / 2;

  // Search forward
  let right0 = peakJd;
  let right1 = peakJd + windowDays;
  let r_right0 = getEarthShadow(right0, 0, deltaT).r - radiusLimit;
  let r_right1 = getEarthShadow(right1, 0, deltaT).r - radiusLimit;
  if (r_right0 * r_right1 > 0) {
    return 0;
  }
  for (let iter = 0; iter < 24; iter++) {
    const mid = (right0 + right1) / 2;
    const r_mid = getEarthShadow(mid, 0, deltaT).r - radiusLimit;
    if (r_mid < 0) {
      right0 = mid;
    } else {
      right1 = mid;
    }
  }
  const jdEnd = (right0 + right1) / 2;

  return (jdEnd - jdStart) * 1440 / 2;
}

function geoidIntersect(shadow: ShadowInfo, deltaT: number): GlobalSolarEclipseInfo {
  let kind = EclipseKind.Partial;
  const peakJd = shadow.timeJd;
  const distance = shadow.r;
  let latitude: number | undefined;
  let longitude: number | undefined;

  const nutation = computeNutation(peakJd, 0, deltaT);
  const eps = nutation.eps;

  const v = eclToEquD(shadow.dir, eps);
  const e = eclToEquD(shadow.target, eps);

  v.x *= KM_PER_AU;
  v.y *= KM_PER_AU;
  v.z *= KM_PER_AU / EARTH_FLATTENING;
  
  e.x *= KM_PER_AU;
  e.y *= KM_PER_AU;
  e.z *= KM_PER_AU / EARTH_FLATTENING;

  const R = EARTH_EQUATORIAL_RADIUS_KM;
  const A = v.x * v.x + v.y * v.y + v.z * v.z;
  const B = -2.0 * (v.x * e.x + v.y * e.y + v.z * e.z);
  const C = (e.x * e.x + e.y * e.y + e.z * e.z) - R * R;
  const radic = B * B - 4.0 * A * C;

  let obscuration: number | undefined;

  if (radic > 0.0) {
    const u = (-B - Math.sqrt(radic)) / (2.0 * A);
    const px = u * v.x - e.x;
    const py = u * v.y - e.y;
    const pz = (u * v.z - e.z) * EARTH_FLATTENING;

    const proj = Math.hypot(px, py) * EARTH_FLATTENING_SQUARED;
    if (proj === 0.0) {
      latitude = pz > 0.0 ? 90.0 : -90.0;
    } else {
      latitude = RAD2DEG * Math.atan(pz / proj);
    }

    const solar = new SolarEphemeris(peakJd, 0, deltaT);
    const gast = solar.gast;
    longitude = (RAD2DEG * Math.atan2(py, px) - gast) % 360.0;
    if (longitude <= -180.0) {
      longitude += 360.0;
    } else if (longitude > 180.0) {
      longitude -= 360.0;
    }

    const epsRad = -eps * DEG2RAD;
    const cosNegE = Math.cos(epsRad);
    const sinNegE = Math.sin(epsRad);
    const o_equ = { x: px / KM_PER_AU, y: py / KM_PER_AU, z: pz / KM_PER_AU };
    const o_ecl = {
      x: o_equ.x,
      y: o_equ.y * cosNegE - o_equ.z * sinNegE,
      z: o_equ.y * sinNegE + o_equ.z * cosNegE,
    };

    const lo = {
      x: o_ecl.x + shadow.target.x,
      y: o_ecl.y + shadow.target.y,
      z: o_ecl.z + shadow.target.z,
    };

    const surface = calcShadow(MOON_POLAR_RADIUS_KM, peakJd, lo, shadow.dir);
    kind = eclipseKindFromUmbra(surface.k);
    obscuration = kind === EclipseKind.Total ? 1.0 : solarEclipseObscuration(shadow.dir, lo);
  } else {
    obscuration = undefined;
  }

  return {
    kind,
    obscuration,
    peak: eventTimeFromJd(peakJd),
    distance,
    latitude,
    longitude,
  };
}

export function searchLunarEclipse(startTimeJd: number, maxMoons: number = 12, config?: DiagnosticsConfig): LunarEclipseInfo {
  const { year } = julianDayToDate(startTimeJd);
  const deltaT = calculateDeltaT(year);
  const finder = new LunarEventFinder(deltaT);

  let fmtime = startTimeJd;
  for (let fmcount = 0; fmcount < maxMoons; ++fmcount) {
    if (config?.signal?.aborted) {
      throw new OperationAbortedError('searchLunarEclipse aborted via signal.');
    }
    config?.logger?.(`[searchLunarEclipse] Evaluating full moon ${fmcount + 1}/${maxMoons} near JD ${fmtime}`, 'debug');

    const fullmoon = finder.findNextFullMoon(fmtime);
    const fullmoonJd = fullmoon.julianDay;

    const lunar = new LunarEphemeris(fullmoonJd, 0, deltaT);
    const eclip_lat = lunar.betaMoon;

    if (Math.abs(eclip_lat) < 1.8) {
      const shadow = findPeakEarthShadow(fullmoonJd, deltaT);
      if (shadow.r < shadow.p + MOON_MEAN_RADIUS_KM) {
        let kind = EclipseKind.Penumbral;
        let obscuration = 0.0;
        let sdTotal = 0.0;
        let sdPartial = 0.0;
        const sdPenumbral = getShadowSemiDuration(shadow.timeJd, shadow.p + MOON_MEAN_RADIUS_KM, 200.0, deltaT);

        if (shadow.r < shadow.k + MOON_MEAN_RADIUS_KM) {
          kind = EclipseKind.Partial;
          sdPartial = getShadowSemiDuration(shadow.timeJd, shadow.k + MOON_MEAN_RADIUS_KM, sdPenumbral, deltaT);

          if (shadow.r + MOON_MEAN_RADIUS_KM < shadow.k) {
            kind = EclipseKind.Total;
            obscuration = 1.0;
            sdTotal = getShadowSemiDuration(shadow.timeJd, shadow.k - MOON_MEAN_RADIUS_KM, sdPartial, deltaT);
          } else {
            obscuration = Obscuration(MOON_MEAN_RADIUS_KM, shadow.k, shadow.r);
          }
        }
        return {
          kind,
          obscuration,
          peak: eventTimeFromJd(shadow.timeJd),
          sdPenumbral,
          sdPartial,
          sdTotal,
        };
      }
    }
    fmtime = fullmoonJd + 10.0;
  }
  throw new SearchConvergenceError(`Failed to find lunar eclipse within ${maxMoons} full moons.`);
}

export function searchGlobalSolarEclipse(startTimeJd: number, maxMoons: number = 12, config?: DiagnosticsConfig): GlobalSolarEclipseInfo {
  const { year } = julianDayToDate(startTimeJd);
  const deltaT = calculateDeltaT(year);
  const finder = new LunarEventFinder(deltaT);

  let nmtime = startTimeJd;
  for (let nmcount = 0; nmcount < maxMoons; ++nmcount) {
    if (config?.signal?.aborted) {
      throw new OperationAbortedError('searchGlobalSolarEclipse aborted via signal.');
    }
    config?.logger?.(`[searchGlobalSolarEclipse] Evaluating new moon ${nmcount + 1}/${maxMoons} near JD ${nmtime}`, 'debug');

    const newmoon = finder.findNextNewMoon(nmtime);
    const newmoonJd = newmoon.julianDay;

    const lunar = new LunarEphemeris(newmoonJd, 0, deltaT);
    const eclip_lat = lunar.betaMoon;

    if (Math.abs(eclip_lat) < 1.8) {
      const shadow = findPeakMoonShadow(newmoonJd, deltaT);
      if (shadow.r < shadow.p + EARTH_MEAN_RADIUS_KM) {
        return geoidIntersect(shadow, deltaT);
      }
    }
    nmtime = newmoonJd + 10.0;
  }
  throw new SearchConvergenceError(`Failed to find solar eclipse within ${maxMoons} new moons.`);
}

export function nextLunarEclipse(prevEclipseJd: number, config?: DiagnosticsConfig): LunarEclipseInfo {
  return searchLunarEclipse(prevEclipseJd + 10.0, 12, config);
}

export function nextGlobalSolarEclipse(prevEclipseJd: number, config?: DiagnosticsConfig): GlobalSolarEclipseInfo {
  return searchGlobalSolarEclipse(prevEclipseJd + 10.0, 12, config);
}

export function localMoonShadow(jd: number, observer: GeographicPosition, deltaT: number): ShadowInfo {
  const solar = new SolarEphemeris(jd, 0, deltaT);
  const st = solar.gast;

  const phi = observer.latitude * DEG2RAD;
  const sinphi = Math.sin(phi);
  const cosphi = Math.cos(phi);
  const c = 1 / Math.hypot(cosphi, EARTH_FLATTENING * sinphi);
  const s = EARTH_FLATTENING_SQUARED * c;
  const ht_km = (observer.altitude ?? 0) / 1000;
  const ach = EARTH_EQUATORIAL_RADIUS_KM * c + ht_km;
  const ash = EARTH_EQUATORIAL_RADIUS_KM * s + ht_km;
  const stlocl = (st + observer.longitude) * DEG2RAD;
  const sinst = Math.sin(stlocl);
  const cosst = Math.cos(stlocl);

  const pos_eqd = {
    x: ach * cosphi * cosst / KM_PER_AU,
    y: ach * cosphi * sinst / KM_PER_AU,
    z: ash * sinphi / KM_PER_AU,
  };

  const nutation = computeNutation(jd, 0, deltaT);
  const eps = nutation.eps;

  const pos_ecl = equDToEcl(pos_eqd, eps);

  const m = getMoonVector(new LunarEphemeris(jd, 0, deltaT));
  const sun_pos = getSunVector(solar);

  const o = {
    x: pos_ecl.x - m.x,
    y: pos_ecl.y - m.y,
    z: pos_ecl.z - m.z,
  };

  const hm = {
    x: m.x - sun_pos.x,
    y: m.y - sun_pos.y,
    z: m.z - sun_pos.z,
  };

  return calcShadow(MOON_MEAN_RADIUS_KM, jd, o, hm);
}

function equDToEcl(v: Vector3D, epsDeg: number): Vector3D {
  const epsRad = -epsDeg * DEG2RAD;
  const cosNegE = Math.cos(epsRad);
  const sinNegE = Math.sin(epsRad);
  return {
    x: v.x,
    y: v.y * cosNegE - v.z * sinNegE,
    z: v.y * sinNegE + v.z * cosNegE,
  };
}

function local_partial_distance(shadow: ShadowInfo): number {
  return shadow.p - shadow.r;
}

function local_total_distance(shadow: ShadowInfo): number {
  return Math.abs(shadow.k) - shadow.r;
}

function getLocalMoonShadowSlope(jd: number, observer: GeographicPosition, deltaT: number): number {
  const dt = 1.0 / 86400.0;
  const r1 = localMoonShadow(jd - dt, observer, deltaT).r;
  const r2 = localMoonShadow(jd + dt, observer, deltaT).r;
  return (r2 - r1) / dt;
}

function findPeakLocalMoonShadow(nmJd: number, observer: GeographicPosition, deltaT: number): ShadowInfo {
  let t0 = nmJd - 0.2;
  let t1 = nmJd + 0.2;
  let s0 = getLocalMoonShadowSlope(t0, observer, deltaT);
  let s1 = getLocalMoonShadowSlope(t1, observer, deltaT);
  if (Math.sign(s0) !== Math.sign(s1)) {
    for (let iter = 0; iter < 30; iter++) {
      const tmid = (t0 + t1) / 2;
      const smid = getLocalMoonShadowSlope(tmid, observer, deltaT);
      if (Math.abs(smid) < 1e-8) {
        t0 = tmid;
        break;
      }
      if (Math.sign(smid) === Math.sign(s0)) {
        t0 = tmid;
        s0 = smid;
      } else {
        t1 = tmid;
        s1 = smid;
      }
    }
  }
  const peakJd = (t0 + t1) / 2;
  return localMoonShadow(peakJd, observer, deltaT);
}

function findLocalTransition(
  observer: GeographicPosition,
  direction: number,
  func: (s: ShadowInfo) => number,
  t1: number,
  t2: number,
  deltaT: number
): number {
  let low = t1;
  let high = t2;
  let f_low = direction * func(localMoonShadow(low, observer, deltaT));
  let f_high = direction * func(localMoonShadow(high, observer, deltaT));

  if (f_low * f_high > 0) {
    return (t1 + t2) / 2;
  }

  for (let iter = 0; iter < 30; iter++) {
    const mid = (low + high) / 2;
    const f_mid = direction * func(localMoonShadow(mid, observer, deltaT));
    if (Math.abs(f_mid) < 1e-8) {
      low = mid;
      break;
    }
    if (f_mid * f_low > 0) {
      low = mid;
      f_low = f_mid;
    } else {
      high = mid;
      f_high = f_mid;
    }
  }
  return (low + high) / 2;
}

function getSunAltitude(jd: number, observer: GeographicPosition): number {
  const { year } = julianDayToDate(jd);
  const deltaT = calculateDeltaT(year);
  const solar = new SolarEphemeris(jd, 0, deltaT);
  return computeHorizontalPosition(solar.gha, solar.declination, observer).altitude;
}

function calculateLocalEclipse(
  shadow: ShadowInfo,
  observer: GeographicPosition,
  deltaT: number
): LocalSolarEclipseInfo {
  const PARTIAL_WINDOW = 0.2; // days (~4.8 hours)
  const TOTAL_WINDOW = 0.01;   // days (~14.4 minutes)

  const peakAltitude = getSunAltitude(shadow.timeJd, observer);
  const peak: EclipseEvent = {
    time: eventTimeFromJd(shadow.timeJd),
    altitude: peakAltitude,
  };

  const t_begin_partial = findLocalTransition(
    observer,
    1.0,
    local_partial_distance,
    shadow.timeJd - PARTIAL_WINDOW,
    shadow.timeJd,
    deltaT
  );
  const partialBegin: EclipseEvent = {
    time: eventTimeFromJd(t_begin_partial),
    altitude: getSunAltitude(t_begin_partial, observer),
  };

  const t_end_partial = findLocalTransition(
    observer,
    -1.0,
    local_partial_distance,
    shadow.timeJd,
    shadow.timeJd + PARTIAL_WINDOW,
    deltaT
  );
  const partialEnd: EclipseEvent = {
    time: eventTimeFromJd(t_end_partial),
    altitude: getSunAltitude(t_end_partial, observer),
  };

  let totalBegin: EclipseEvent | undefined;
  let totalEnd: EclipseEvent | undefined;
  let kind = EclipseKind.Partial;

  if (shadow.r < Math.abs(shadow.k)) {
    const t_begin_total = findLocalTransition(
      observer,
      1.0,
      local_total_distance,
      shadow.timeJd - TOTAL_WINDOW,
      shadow.timeJd,
      deltaT
    );
    totalBegin = {
      time: eventTimeFromJd(t_begin_total),
      altitude: getSunAltitude(t_begin_total, observer),
    };

    const t_end_total = findLocalTransition(
      observer,
      -1.0,
      local_total_distance,
      shadow.timeJd,
      shadow.timeJd + TOTAL_WINDOW,
      deltaT
    );
    totalEnd = {
      time: eventTimeFromJd(t_end_total),
      altitude: getSunAltitude(t_end_total, observer),
    };

    kind = eclipseKindFromUmbra(shadow.k);
  }

  const obscuration = kind === EclipseKind.Total ? 1.0 : solarEclipseObscuration(shadow.dir, shadow.target);

  return {
    kind,
    obscuration,
    partialBegin,
    totalBegin,
    peak,
    totalEnd,
    partialEnd,
  };
}

export function searchLocalSolarEclipse(
  startTimeJd: number,
  observer: GeographicPosition,
  maxMoons: number = 40,
  config?: DiagnosticsConfig
): LocalSolarEclipseInfo {
  const { year } = julianDayToDate(startTimeJd);
  const deltaT = calculateDeltaT(year);
  const finder = new LunarEventFinder(deltaT);

  let nmtime = startTimeJd;
  for (let nmcount = 0; nmcount < maxMoons; ++nmcount) {
    if (config?.signal?.aborted) {
      throw new OperationAbortedError('searchLocalSolarEclipse aborted via signal.');
    }
    config?.logger?.(`[searchLocalSolarEclipse] Evaluating new moon ${nmcount + 1}/${maxMoons} near JD ${nmtime}`, 'debug');

    const newmoon = finder.findNextNewMoon(nmtime);
    const newmoonJd = newmoon.julianDay;

    const lunar = new LunarEphemeris(newmoonJd, 0, deltaT);
    const eclip_lat = lunar.betaMoon;

    if (Math.abs(eclip_lat) < 1.8) {
      const shadow = findPeakLocalMoonShadow(newmoonJd, observer, deltaT);
      if (shadow.r < shadow.p) {
        const localInfo = calculateLocalEclipse(shadow, observer, deltaT);
        if (localInfo.partialBegin.altitude > 0 || localInfo.partialEnd.altitude > 0) {
          return localInfo;
        }
      }
    }
    nmtime = newmoonJd + 10.0;
  }
  throw new SearchConvergenceError(`Failed to find local solar eclipse within ${maxMoons} new moons.`);
}

export function nextLocalSolarEclipse(
  prevEclipseJd: number,
  observer: GeographicPosition,
  config?: DiagnosticsConfig
): LocalSolarEclipseInfo {
  return searchLocalSolarEclipse(prevEclipseJd + 10.0, observer, 40, config);
}

