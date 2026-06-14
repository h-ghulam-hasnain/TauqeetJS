import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../../src/prayer/calculate.js';

describe('Prayer Module: Extreme Edge Cases & Boundary Values', () => {
  const summerSolstice = new Date(Date.UTC(2026, 5, 21)); // June 21, 2026
  const winterSolstice = new Date(Date.UTC(2026, 11, 21)); // December 21, 2026
  const equinox = new Date(Date.UTC(2026, 2, 20)); // March 20, 2026

  describe('Boundary Latitude Limits', () => {
    it('should calculate successfully for near-north-pole coordinates (e.g., 89.9° N) without throwing', () => {
      const result = getPrayerTimes({
        lat: 89.9,
        long: 0,
        date: equinox
      });
      // At equinox, near poles can be calculated or might return success with special status.
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dhuhr).toBeDefined();
      }
    });

    it('should calculate successfully for near-south-pole coordinates (e.g., -89.9° S) without throwing', () => {
      const result = getPrayerTimes({
        lat: -89.9,
        long: 0,
        date: equinox
      });
      expect(result.success).toBe(true);
    });

    it('should process exact equator and prime meridian intersection [0, 0] normally', () => {
      const result = getPrayerTimes({
        lat: 0,
        long: 0,
        date: equinox
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fajr.status).toBe('SUCCESS');
        expect(result.data.sunrise.status).toBe('SUCCESS');
        expect(result.data.maghrib.status).toBe('SUCCESS');
      }
    });
  });

  describe('Polar Astronomical Invariants (Midnight Sun and Polar Night)', () => {
    it('should return POLAR_DAY status during Summer Solstice in Tromsø, Norway', () => {
      const tromso = { latitude: 69.6492, longitude: 18.9553 };
      const result = getPrayerTimes({
        location: tromso,
        date: summerSolstice
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Under Midnight Sun, the sun never sets, so sunrise/sunset do not occur normally.
        expect(result.data.sunrise.status).toBe('POLAR_DAY');
        expect(result.data.maghrib.status).toBe('POLAR_DAY');
        expect(result.data.fajr.status).toBe('POLAR_DAY');
        expect(result.data.isha.status).toBe('POLAR_DAY');
      }
    });

    it('should handle Polar Night during Winter Solstice in Tromsø, Norway gracefully', () => {
      const tromso = { latitude: 69.6492, longitude: 18.9553 };
      const result = getPrayerTimes({
        location: tromso,
        date: winterSolstice
      });

      expect(result.success).toBe(true);
      if (result.success) {
        // Under Polar Night, the sun never rises, so we expect POLAR_NIGHT status
        expect(result.data.sunrise.status).toBe('POLAR_NIGHT');
        expect(result.data.maghrib.status).toBe('POLAR_NIGHT');
      }
    });
  });
});
