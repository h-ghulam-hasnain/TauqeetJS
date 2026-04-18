import { describe, it, expect } from 'vitest';
import { PrayerEngine } from '../src/prayer/engine.js';

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
});
