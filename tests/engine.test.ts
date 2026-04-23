import { describe, it, expect } from 'vitest';
import { PrayerEngine } from '../src/prayer/engine.js';
import { getMonthlyPrayerTimes, getRamadanSchedule } from '../src/prayer/index.js';

describe('PrayerEngine', () => {
  it('should calculate prayer times for Abu Dhabi', () => {
    // Abu Dhabi: 24.4667° N, 54.3667° E
    const coords = { latitude: 24.4667, longitude: 54.3667 };
    const engine = new PrayerEngine(coords, 'Karachi');

    // Test for 2026-04-18 (Today according to current time in metadata)
    const date = new Date('2026-04-18');
    const times = engine.calculate(date);

    expect(times.fajr).toBeInstanceOf(Date);
    expect(times.sunrise).toBeInstanceOf(Date);
    expect(times.dhuhr).toBeInstanceOf(Date);
    expect(times.asr).toBeInstanceOf(Date);
    expect(times.maghrib).toBeInstanceOf(Date);
    expect(times.isha).toBeInstanceOf(Date);

    console.log('Abu Dhabi Prayer Times (2026-04-18):');
    console.log('Fajr:   ', times.fajr.toUTCString());
    console.log('Sunrise:', times.sunrise.toUTCString());
    console.log('Dhuhr:  ', times.dhuhr.toUTCString());
    console.log('Asr:    ', times.asr.toUTCString());
    console.log('Maghrib:', times.maghrib.toUTCString());
    console.log('Isha:   ', times.isha.toUTCString());
  });

  it('should build a monthly prayer times table for January 2026', () => {
    const table = getMonthlyPrayerTimes({
      location: { latitude: 31.3996, longitude: 73.0200 },
      method: 'Karachi',
      madhab: 'Hanafi',
      month: 1,
      year: 2026
    });

    expect(table.length).toBe(31);
    expect(table[0].date).toBe('2026-01-01');
    expect(table[0].fajr).toBeInstanceOf(Date);
    expect(table[table.length - 1].date).toBe('2026-01-31');
  });

  it('should create a Ramadan sahar and iftar schedule within 30 days', () => {
    const schedule = getRamadanSchedule({
      location: { latitude: 31.3996, longitude: 73.0200 },
      method: 'Karachi',
      madhab: 'Hanafi',
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-20')
    });

    expect(schedule.length).toBe(11);
    expect(schedule[0].sahurEndsAt.getTime()).toBe(schedule[0].fajr.getTime());
    expect(schedule[0].iftarAt.getTime()).toBe(schedule[0].maghrib.getTime());
    expect(schedule[0].date).toBe('2026-03-10');
  });
});
