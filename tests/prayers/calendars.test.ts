import { describe, it, expect } from 'vitest';
import { CalendarService } from '../../src/prayers/calendars/calendarService.js';
import { Madhab } from '../../src/prayers/config/madhabs.js';
import { BUILT_IN_METHODS } from '../../src/prayers/config/methodRegistry.js';
import type { PrayerConfig } from '../../src/prayers/types/index.js';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

/** New York City — mid-latitude, well-behaved solar cycle. */
const NYC_CONFIG: PrayerConfig = {
  lat: 40.7128,
  long: -74.006,
  timeZone: 'UTC',
  method: BUILT_IN_METHODS[Madhab.SHAFI].MWLShafi,
  madhab: 'Shafi',
};

/** Karachi — South Asian location with Hanafi Madhab. */
const KHI_HANAFI_CONFIG: PrayerConfig = {
  lat: 24.8607,
  long: 67.0011,
  timeZone: 'UTC',
  method: BUILT_IN_METHODS[Madhab.HANAFI].KarachiHanafi,
  madhab: 'Hanafi',
};

/** Karachi — same location but Shafi Madhab (for Asr shift comparison). */
const KHI_SHAFI_CONFIG: PrayerConfig = {
  lat: 24.8607,
  long: 67.0011,
  timeZone: 'UTC',
  method: BUILT_IN_METHODS[Madhab.SHAFI].MWLShafi,
  madhab: 'Shafi',
};

const service = new CalendarService();

// ─── generateMonthlyCalendar ──────────────────────────────────────────────────

describe('CalendarService.generateMonthlyCalendar', () => {
  it('generates 29 days for February in a leap year (2024)', () => {
    const cal = service.generateMonthlyCalendar(2024, 2, NYC_CONFIG);
    expect(cal.year).toBe(2024);
    expect(cal.month).toBe(2);
    expect(cal.days.length).toBe(29);
    expect(cal.days[0]?.date).toBe('2024-02-01');
    expect(cal.days[28]?.date).toBe('2024-02-29');
  });

  it('generates 28 days for February in a common year (2023)', () => {
    const cal = service.generateMonthlyCalendar(2023, 2, NYC_CONFIG);
    expect(cal.days.length).toBe(28);
    expect(cal.days[27]?.date).toBe('2023-02-28');
  });

  it('generates 31 days for January', () => {
    const cal = service.generateMonthlyCalendar(2026, 1, NYC_CONFIG);
    expect(cal.days.length).toBe(31);
    expect(cal.days[30]?.date).toBe('2026-01-31');
  });

  it('generates 30 days for April', () => {
    const cal = service.generateMonthlyCalendar(2026, 4, NYC_CONFIG);
    expect(cal.days.length).toBe(30);
    expect(cal.days[29]?.date).toBe('2026-04-30');
  });

  it('returns a valid fajr UTC string on day 1', () => {
    const cal = service.generateMonthlyCalendar(2026, 6, NYC_CONFIG);
    const day1 = cal.days[0];
    expect(day1).toBeDefined();
    expect(day1?.fajr).not.toBeNull();
    expect(typeof day1?.fajr).toBe('string');
    // Must be a valid ISO string
    expect(new Date(day1?.fajr!).toISOString()).toBe(day1?.fajr);
  });

  it('throws for month < 1', () => {
    expect(() => service.generateMonthlyCalendar(2026, 0, NYC_CONFIG)).toThrow();
  });

  it('throws for month > 12', () => {
    expect(() => service.generateMonthlyCalendar(2026, 13, NYC_CONFIG)).toThrow();
  });

  it('throws for invalid config (missing lat)', () => {
    const bad = { long: -74, timeZone: 'UTC' } as unknown as PrayerConfig;
    expect(() => service.generateMonthlyCalendar(2026, 6, bad)).toThrow();
  });
});

// ─── generateAnnualCalendar ───────────────────────────────────────────────────

describe('CalendarService.generateAnnualCalendar', () => {
  it('returns exactly 12 months', () => {
    const cal = service.generateAnnualCalendar(2025, NYC_CONFIG);
    expect(cal.year).toBe(2025);
    expect(cal.months.length).toBe(12);
  });

  it('month indices and day counts are correct for 2024 (leap)', () => {
    const cal = service.generateAnnualCalendar(2024, NYC_CONFIG);
    const dayCountsByMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    cal.months.forEach((m, i) => {
      expect(m.month).toBe(i + 1);
      expect(m.days.length).toBe(dayCountsByMonth[i]);
    });
  });

  it('month indices and day counts are correct for 2025 (common)', () => {
    const cal = service.generateAnnualCalendar(2025, NYC_CONFIG);
    const dayCountsByMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    cal.months.forEach((m, i) => {
      expect(m.month).toBe(i + 1);
      expect(m.days.length).toBe(dayCountsByMonth[i]);
    });
  });

  it('first and last date strings are correct for 2026', () => {
    const cal = service.generateAnnualCalendar(2026, NYC_CONFIG);
    expect(cal.months[0]?.days[0]?.date).toBe('2026-01-01');
    expect(cal.months[11]?.days[30]?.date).toBe('2026-12-31');
  });
});

// ─── Madhab Asr shift — configuration inheritance ─────────────────────────────

describe('CalendarService — Madhab Asr time shift', () => {
  it('Hanafi Asr is always later than Shafi Asr on the same day and location', () => {
    // Test across a full Ramadan-length window (30 days in summer)
    const hanafiCal = service.generateMonthlyCalendar(2026, 6, KHI_HANAFI_CONFIG);
    const shafiCal  = service.generateMonthlyCalendar(2026, 6, KHI_SHAFI_CONFIG);

    expect(hanafiCal.days.length).toBe(shafiCal.days.length);

    for (let i = 0; i < hanafiCal.days.length; i++) {
      const hanafiAsr = hanafiCal.days[i]?.asr;
      const shafiAsr  = shafiCal.days[i]?.asr;

      // Both must be non-null for a tropical location
      expect(hanafiAsr).not.toBeNull();
      expect(shafiAsr).not.toBeNull();

      // Hanafi uses 2× shadow (later afternoon) → timestamp must be strictly later
      const hanafiTs = new Date(hanafiAsr!).getTime();
      const shafiTs  = new Date(shafiAsr!).getTime();
      expect(hanafiTs).toBeGreaterThan(shafiTs);
    }
  });
});

// ─── generateRamadanCalendar ──────────────────────────────────────────────────

describe('CalendarService.generateRamadanCalendar', () => {
  // Ramadan 1445 AH — started 11 March 2024 per Umm al-Qura
  const RAMADAN_START = '2024-03-11';

  it('generates 30 days by default', () => {
    const cal = service.generateRamadanCalendar(RAMADAN_START, NYC_CONFIG);
    expect(cal.startDate).toBe(RAMADAN_START);
    expect(cal.duration).toBe(30);
    expect(cal.days.length).toBe(30);
    // 30 days after Mar 11 (inclusive) lands on Apr 9
    expect(cal.endDate).toBe('2024-04-09');
  });

  it('generates exactly 29 days', () => {
    const cal = service.generateRamadanCalendar(RAMADAN_START, NYC_CONFIG, 29);
    expect(cal.duration).toBe(29);
    expect(cal.days.length).toBe(29);
    expect(cal.endDate).toBe('2024-04-08');
  });

  it('generates exactly 31 days', () => {
    const cal = service.generateRamadanCalendar(RAMADAN_START, NYC_CONFIG, 31);
    expect(cal.duration).toBe(31);
    expect(cal.days.length).toBe(31);
    expect(cal.endDate).toBe('2024-04-10');
  });

  it('handles a Ramadan window spanning two Gregorian months', () => {
    // Start near end of February — boundary crosses into March
    const cal = service.generateRamadanCalendar('2024-02-15', NYC_CONFIG, 30);
    expect(cal.days[0]?.date).toBe('2024-02-15');
    // 30 days from Feb 15 lands on Mar 15
    expect(cal.endDate).toBe('2024-03-15');
    // Each date step must be sequential
    for (let i = 1; i < cal.days.length; i++) {
      const prev = new Date(cal.days[i - 1]!.date).getTime();
      const curr = new Date(cal.days[i]!.date).getTime();
      expect(curr - prev).toBe(86_400_000); // exactly 1 day apart
    }
  });

  it('all suhoor (Fajr) times are before all Iftar (Maghrib) times', () => {
    const cal = service.generateRamadanCalendar(RAMADAN_START, KHI_SHAFI_CONFIG, 30);
    for (const day of cal.days) {
      expect(day.fajr).not.toBeNull();
      expect(day.maghrib).not.toBeNull();
      const fajrTs   = new Date(day.fajr!).getTime();
      const maghribTs = new Date(day.maghrib!).getTime();
      expect(fajrTs).toBeLessThan(maghribTs);
    }
  });

  it('throws for duration < 29', () => {
    expect(() =>
      service.generateRamadanCalendar(RAMADAN_START, NYC_CONFIG, 28)
    ).toThrow();
  });

  it('throws for duration > 31', () => {
    expect(() =>
      service.generateRamadanCalendar(RAMADAN_START, NYC_CONFIG, 32)
    ).toThrow();
  });

  it('throws for a malformed startDate', () => {
    expect(() =>
      service.generateRamadanCalendar('not-a-date', NYC_CONFIG, 30)
    ).toThrow();
  });
});
