export const calculateDeltaT = (year: number): number => {
  if (year < -2000 || year > 3000) {
    throw new RangeError('Year out of range. Astronomical models are only valid between years -2000 and 3000.');
  }
  if (year < -500) {
    const u = (year - 1820) / 100;
    return -20 + 32 * u * u;
  }
  if (year < 500) {
    const u = year / 100;
    return (
      10583.6 -
      1014.41 * u +
      33.7831 * u * u -
      5.95205 * u * u * u -
      0.179848 * Math.pow(u, 4) +
      0.0221741 * Math.pow(u, 5) +
      0.00903165 * Math.pow(u, 6)
    );
  }
  if (year < 1600) {
    const u = (year - 1000) / 100;
    return (
      1570 -
      157.42 * u -
      51.5205 * u * u +
      17.5101 * u * u * u -
      0.720364 * Math.pow(u, 4) +
      0.01633 * Math.pow(u, 5) -
      0.113063 * Math.pow(u, 6)
    );
  }
  if (year < 1700) {
    const t = year - 1600;
    return 120 - 0.9808 * t - 0.01532 * t * t + (t * t * t) / 7129;
  }
  if (year < 1800) {
    const t = year - 1700;
    return (
      8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t * t * t - Math.pow(t, 4) / 1174000
    );
  }
  if (year < 1860) {
    const t = year - 1800;
    return (
      13.72 -
      0.332447 * t +
      0.0068612 * t * t +
      0.0041116 * t * t * t -
      Math.pow(t, 4) / 1022000 +
      Math.pow(t, 5) / 26160000 -
      Math.pow(t, 6) / 200000000
    );
  }
  if (year < 1900) {
    const t = year - 1860;
    return (
      7.62 +
      0.5737 * t -
      0.251754 * t * t +
      0.0168066 * t * t * t -
      Math.pow(t, 4) / 328000 +
      Math.pow(t, 5) / 21200000
    );
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
    return (
      63.86 +
      0.3345 * t -
      0.060374 * t * t +
      0.0017275 * t * t * t +
      0.000653935 * Math.pow(t, 4) +
      0.0000237359 * Math.pow(t, 5)
    );
  }
  if (year < 2033) {
    // ── IERS Bulletin A measured & predicted ΔT (seconds) ──────────────────────
    // Source: IERS Bulletin A + USNO measurements (updated 2026-07)
    // Annual values at January 1 of each year.
    // 2005–2025: measured values (±0.1 s accuracy)
    // 2026–2032: IERS Bulletin A predictions (±0.5 s accuracy)
    const TABLE: readonly [number, number][] = [
      [2005, 64.69], [2006, 64.85], [2007, 65.15], [2008, 65.46],
      [2009, 65.78], [2010, 66.07], [2011, 66.32], [2012, 66.60],
      [2013, 66.91], [2014, 67.28], [2015, 67.64], [2016, 68.10],
      [2017, 68.59], [2018, 68.97], [2019, 69.22], [2020, 69.36],
      [2021, 69.36], [2022, 69.29], [2023, 69.22], [2024, 69.18],
      [2025, 69.87], [2026, 70.50], [2027, 71.10], [2028, 71.70],
      [2029, 72.30], [2030, 72.90], [2031, 73.40], [2032, 74.00],
    ];

    const yearFloor = Math.floor(year);
    const frac     = year - yearFloor;

    // Find the entry for yearFloor
    const i0 = TABLE.findIndex(([y]) => y === yearFloor);
    if (i0 !== -1) {
      // Assign to local first so TypeScript can narrow away `| undefined`
      const entry = TABLE[i0]!;
      const dT0   = entry[1];
      // Linearly interpolate to the next year if available
      if (i0 + 1 < TABLE.length) {
        const nextEntry = TABLE[i0 + 1]!;
        const dT1       = nextEntry[1];
        return dT0 + frac * (dT1 - dT0);
      }
      return dT0;
    }
  }
  if (year < 2050) {
    // Espenak & Meeus (2006) predictive polynomial — fallback for 2033–2049
    const t = year - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t * t;
  }
  if (year < 2150) {
    return -20 + 32 * Math.pow((year - 1820) / 100, 2) - 0.5628 * (2150 - year);
  }
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u;
};
