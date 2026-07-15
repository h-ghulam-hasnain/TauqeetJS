import { describe, it, expect } from 'vitest';
import { getPrayerTimesLegacy } from '../../src/prayers/legacy.js';;

describe('Extended Test: High Latitude & Midnight Sun', () => {
  const tromso = { lat: 69.6492, long: 18.9553 };

  it('should gracefully handle Tromsø (Norway) during Summer Solstice', () => {
    // Tromsø (latitude ~69.6) experiences the Midnight Sun in late June.
    // The sun does not set, meaning Maghrib, Isha, and Fajr cannot be calculated via standard geometry.
    const summerSolstice = new Date(Date.UTC(2024, 5, 21));

    const result = getPrayerTimesLegacy({ ...tromso, date: summerSolstice });

    // It should NOT throw an unhandled exception. It must return a graceful Success with status POLAR_DAY.
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.sunrise.status).toBe('POLAR_DAY');
    }
  });

  it('should process Tromsø correctly during Equinox', () => {
    // During the equinox (March/September), the sun rises and sets normally even at high latitudes.
    const springEquinox = new Date(Date.UTC(2024, 2, 20));

    const result = getPrayerTimesLegacy({ ...tromso, date: springEquinox });

    // It should succeed because standard geometry works here.
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.sunrise).toHaveProperty('timestamp');
      expect(result.data.maghrib).toHaveProperty('timestamp');
      expect(result.data.sunrise.timestamp).toBeDefined();
    }
  });
});
