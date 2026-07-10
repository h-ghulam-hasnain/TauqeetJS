import { describe, it, expect } from 'vitest';
import {
  searchLunarEclipse,
  searchGlobalSolarEclipse,
  nextLunarEclipse,
  nextGlobalSolarEclipse,
  searchLocalSolarEclipse,
  dateToJulianDay,
  EclipseKind,
} from '../../src/astronomy/index.js';

describe('Lunar and Solar Eclipses Validation', () => {
  it(
    'should find 2026 lunar eclipses accurately',
    { timeout: 30000 },
    () => {
    // Start search from Jan 1, 2026
    const startJd = dateToJulianDay(2026, 1, 1);
    const eclipse1 = searchLunarEclipse(startJd);

    // March 3, 2026 Total Lunar Eclipse
    expect(eclipse1.kind).toBe(EclipseKind.Total);
    expect(eclipse1.peak.year).toBe(2026);
    expect(eclipse1.peak.month).toBe(3);
    expect(eclipse1.peak.day).toBe(3);
    expect(eclipse1.peak.hour).toBe(11);
    expect(eclipse1.peak.minute).toBe(33);
    expect(eclipse1.peak.second).toBe(39);
    expect(eclipse1.sdPenumbral).toBeCloseTo(169.66, 1);
    expect(eclipse1.sdPartial).toBeCloseTo(103.88, 1);
    expect(eclipse1.sdTotal).toBeCloseTo(29.66, 1);

    // Next lunar eclipse
    const eclipse2 = nextLunarEclipse(eclipse1.peak.julianDay);
    console.log('2026 Second Lunar Eclipse:', eclipse2);

    // August 28, 2026 Partial Lunar Eclipse
    expect(eclipse2.kind).toBe(EclipseKind.Partial);
    expect(eclipse2.peak.year).toBe(2026);
    expect(eclipse2.peak.month).toBe(8);
    expect(eclipse2.peak.day).toBe(28);
    expect(eclipse2.peak.hour).toBe(4);
    expect(eclipse2.peak.minute).toBe(12);
    expect(eclipse2.peak.second).toBe(53);
    expect(eclipse2.sdPenumbral).toBeCloseTo(169.25, 1);
    expect(eclipse2.sdPartial).toBeCloseTo(99.39, 1);
    expect(eclipse2.sdTotal).toBe(0);
  });

  it(
    'should find 2026 solar eclipses accurately',
    { timeout: 30000 },
    () => {
    // Start search from Jan 1, 2026
    const startJd = dateToJulianDay(2026, 1, 1);
    const eclipse1 = searchGlobalSolarEclipse(startJd);

    console.log('2026 First Solar Eclipse:', eclipse1);

    // Feb 17, 2026 Annular Solar Eclipse
    expect(eclipse1.kind).toBe(EclipseKind.Annular);
    expect(eclipse1.peak.year).toBe(2026);
    expect(eclipse1.peak.month).toBe(2);
    expect(eclipse1.peak.day).toBe(17);
    expect(eclipse1.peak.hour).toBe(12);
    expect(eclipse1.peak.minute).toBe(11);
    expect(eclipse1.peak.second).toBe(54);
    expect(eclipse1.latitude).toBeCloseTo(-64.72, 1);
    expect(eclipse1.longitude).toBeCloseTo(86.75, 1);

    // Next solar eclipse
    const eclipse2 = nextGlobalSolarEclipse(eclipse1.peak.julianDay);
    console.log('2026 Second Solar Eclipse:', eclipse2);

    // August 12, 2026 Total Solar Eclipse
    expect(eclipse2.kind).toBe(EclipseKind.Total);
    expect(eclipse2.peak.year).toBe(2026);
    expect(eclipse2.peak.month).toBe(8);
    expect(eclipse2.peak.day).toBe(12);
    expect(eclipse2.peak.hour).toBe(17);
    expect(eclipse2.peak.minute).toBe(45);
    expect(eclipse2.peak.second).toBe(54);
    expect(eclipse2.latitude).toBeCloseTo(65.22, 1);
    expect(eclipse2.longitude).toBeCloseTo(-25.23, 1);
  });

  it(
    'should find local solar eclipse accurately for a specific observer',
    { timeout: 30000 },
    () => {
    // Search local solar eclipse from Reykjavik, Iceland
    // Target: August 12, 2026 Total Solar Eclipse
    const startJd = dateToJulianDay(2026, 1, 1);
    const observer = { latitude: 64.1466, longitude: -21.9426 };
    const localEclipse = searchLocalSolarEclipse(startJd, observer);

    expect(localEclipse.kind).toBe(EclipseKind.Total);
    expect(localEclipse.obscuration).toBe(1);

    // Total Begin
    expect(localEclipse.totalBegin!.time.hour).toBe(17);
    expect(localEclipse.totalBegin!.time.minute).toBe(48);
    expect(localEclipse.totalBegin!.time.second).toBeCloseTo(15, -1); // 15s

    // Peak
    expect(localEclipse.peak.time.hour).toBe(17);
    expect(localEclipse.peak.time.minute).toBe(48);
    expect(localEclipse.peak.time.second).toBeCloseTo(46, -1); // 46s
    expect(localEclipse.peak.altitude).toBeCloseTo(24.5, 1);

    // Total End
    expect(localEclipse.totalEnd!.time.hour).toBe(17);
    expect(localEclipse.totalEnd!.time.minute).toBe(49);
    expect(localEclipse.totalEnd!.time.second).toBeCloseTo(16, -1); // 16s
  });
});
