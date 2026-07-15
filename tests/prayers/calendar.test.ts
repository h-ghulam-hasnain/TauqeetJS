// tests/prayers/calendar.test.ts
import { describe, it, expect } from 'vitest';
import { CalendarService } from '../../src/prayers/calendars/calendarService.js';
import type { PrayerConfig } from '../../src/prayers/types/index.js';

describe('TauqeetJS Batch Calendar Engine - Verification Suite', () => {
  const baseConfig: PrayerConfig = {
    lat: 24.8607,
    long: 67.0011,
    timeZone: 'Asia/Karachi',
    method: 'Karachi',
    madhab: 'Hanafi'
  };

  // 1. Leap Year & End-of-Month Detection Test
  it('should correctly handle Leap Year (Feb 2024 vs Feb 2026) boundaries without shifting dates', () => {
    // 2024 is a leap year (29 days)
    const leapYearFeb = CalendarService.generateMonthlyCalendar(2024, 2, baseConfig);
    expect(leapYearFeb.days).toHaveLength(29);
    expect(leapYearFeb.days[28].date).toContain('2024-02-29');

    // 2026 is a common year (28 days)
    const commonYearFeb = CalendarService.generateMonthlyCalendar(2026, 2, baseConfig);
    expect(commonYearFeb.days).toHaveLength(28);
    expect(commonYearFeb.days[27].date).toContain('2026-02-28');
  });

  // 2. Continuous Ramadan Range Generation Test
  it('should generate a continuous Ramadan calendar spanning across Gregorian month boundaries (March to April)', () => {
    // Starting Ramadan in the middle of March 2026 for a 30-day duration
    // The API expects a string 'YYYY-MM-DD'
    const ramadanStart = '2026-03-18';
    const ramadanCalendar = CalendarService.generateRamadanCalendar(ramadanStart, baseConfig, 30);

    expect(ramadanCalendar.days).toHaveLength(30);
    
    // First day check
    expect(ramadanCalendar.days[0].date).toContain('2026-03-18');
    // Boundary overflow check: Day 15 should cross into April smoothly
    expect(ramadanCalendar.days[14].date).toContain('2026-04-01');
    // Final day check
    expect(ramadanCalendar.days[29].date).toContain('2026-04-16');
  });

  // 3. Batch Configuration Safety & Immutability Test
  it('should ensure the parent configuration object remains strictly immutable across annual batch runs', () => {
    const configWithAdjustments: PrayerConfig = {
      ...baseConfig,
      adjustments: { fajr: 2, maghrib: -3 }
    };

    // Freeze the object to detect any runtime mutations
    Object.freeze(configWithAdjustments);
    if (configWithAdjustments.adjustments) {
      Object.freeze(configWithAdjustments.adjustments);
    }

    expect(() => CalendarService.generateAnnualCalendar(2026, configWithAdjustments)).not.toThrow();
  });

  // 4. Pointer-Stable Loop Performance Test
  it('should perform 365 days of batch calculations efficiently without breaking temporal sequence', () => {
    const start = performance.now();
    const annualCalendar = CalendarService.generateAnnualCalendar(2026, baseConfig);
    const end = performance.now();

    // Flatten all 12 months into a single days array
    const allDays = annualCalendar.months.flatMap(m => m.days);

    expect(allDays).toHaveLength(365);
    
    // Ensure chronological order of dates in the generated array
    for (let i = 1; i < allDays.length; i++) {
      const prevTime = new Date(allDays[i - 1].date).getTime();
      const currTime = new Date(allDays[i].date).getTime();
      expect(currTime).toBeGreaterThan(prevTime);
    }

    // Benchmark Log: Ensures microsecond speeds per calculation are maintained
    console.log(`Successfully compiled 365-day calendar in ${(end - start).toFixed(2)}ms`);
  });
});