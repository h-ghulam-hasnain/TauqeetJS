import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../../src/prayers/index.js';

describe('Extended Test: Atmospheric Impact (Elevation Refraction)', () => {
  const lat = 24.8607;
  const long = 67.0011; // Karachi
  const date = new Date(Date.UTC(2024, 3, 27));

  it('should shift Sunrise earlier and Maghrib later at high altitude', () => {
    const seaLevelResult = getPrayerTimes({ lat, long, elevation: 0, date });
    const highAltResult = getPrayerTimes({ lat, long, elevation: 4000, date }); // 4000m

    expect(seaLevelResult.success).toBe(true);
    expect(highAltResult.success).toBe(true);

    if (seaLevelResult.success && highAltResult.success) {
      const seaLevelSunrise = seaLevelResult.data.sunrise.timestamp! * 1000;
      const highAltSunrise = highAltResult.data.sunrise.timestamp! * 1000;

      const seaLevelMaghrib = seaLevelResult.data.maghrib.timestamp! * 1000;
      const highAltMaghrib = highAltResult.data.maghrib.timestamp! * 1000;

      // At higher altitude, you can see 'further' over the curve of the Earth.
      // Therefore, the sun rises earlier.
      expect(highAltSunrise).toBeLessThan(seaLevelSunrise);

      // And sets later.
      expect(highAltMaghrib).toBeGreaterThan(seaLevelMaghrib);

      // Dhuhr should not be significantly impacted by horizon dip.
      const dhuhrDiff = Math.abs(
        highAltResult.data.dhuhr.timestamp! * 1000 - seaLevelResult.data.dhuhr.timestamp! * 1000
      );
      expect(dhuhrDiff).toBeLessThan(10000); // Less than 10 seconds difference
    }
  });
});
