/**
 * Time and Calendar utilities for astronomical calculations.
 */

/**
 * Calculates the Julian Date for a given Gregorian date and time.
 * Based on Meeus, Astronomical Algorithms, Chapter 7.
 */
export function getJulianDate(date: Date): number {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();
  const ms = date.getUTCMilliseconds();

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);

  const dayFraction = (hour + minute / 60 + (second + ms / 1000) / 3600) / 24;

  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5 +
    dayFraction
  );
}

/**
 * Julian centuries since J2000.0.
 */
export function getJulianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

/**
 * Julian millennia since J2000.0.
 */
export function getJulianMillennia(jc: number): number {
  return 0.1 * jc;
}

/**
 * Approximate Delta T (TT - UT) in seconds.
 * Reference: Espenak and Meeus (2006).
 */
export function getDeltaT(year: number): number {
  if (year < -500) {
    const u = (year - 1820) / 100;
    return -20 + 32 * u * u;
  }
  if (year < 500) {
    const u = year / 100;
    return (
      10583.6 - 1014.41 * u + 33.7831 * u * u - 5.95205 * u * u * u - 0.179848 * u ** 4 + 0.0221741 * u ** 5 + 0.00903165 * u ** 6
    );
  }
  if (year < 1600) {
    const u = (year - 1000) / 100;
    return (
      1570 - 157.42 * u - 51.5205 * u * u + 17.5101 * u * u * u - 0.720364 * u ** 4 + 0.01633 * u ** 5 - 0.113063 * u ** 6
    );
  }
  if (year < 1700) {
    const t = year - 1600;
    return 120 - 0.9808 * t - 0.01532 * t * t + (t * t * t) / 7129;
  }
  if (year < 1800) {
    const t = year - 1700;
    return 8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t * t * t - (t ** 4) / 1174000;
  }
  if (year < 1860) {
    const t = year - 1800;
    return (
      13.72 - 0.332447 * t + 0.0068612 * t * t + 0.0041116 * t * t * t - (t ** 4) / 1022000 + (t ** 5) / 26160000 - (t ** 6) / 200000000
    );
  }
  if (year < 1900) {
    const t = year - 1860;
    return 7.62 + 0.5737 * t - 0.251754 * t * t + 0.0168066 * t * t * t - (t ** 4) / 328000 + (t ** 5) / 21200000;
  }
  if (year < 1920) {
    const t = year - 1900;
    return -2.73 + 0.1218 * t - 0.034114 * t * t + 0.00398787 * t * t * t;
  }
  if (year < 1941) {
    const t = year - 1920;
    return 21.2 + 0.84493 * t - 0.0761 * t * t + 0.0020936 * t * t * t;
  }
  if (year < 1961) {
    const t = year - 1950;
    return 29.07 + 0.407 * t - (t * t) / 233 + (t * t * t) / 2547;
  }
  if (year < 1986) {
    const t = year - 1975;
    return 45.45 + 1.067 * t - (t * t) / 260 - (t * t * t) / 718;
  }
  if (year < 2005) {
    const t = year - 2000;
    return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t * t * t + 0.000653935 * t ** 4 + 0.0000237359 * t ** 5;
  }
  if (year < 2050) {
    const t = year - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
  }
  if (year < 2150) {
    return -20 + 32 * ((year - 1820) / 100) ** 2 - 0.5628 * (2150 - year);
  }
  // Simplified for far future
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u;
}
