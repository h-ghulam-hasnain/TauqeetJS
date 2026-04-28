import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../../src/prayer/calculate.js';

describe('Extended Test: Atmospheric Impact (Elevation Refraction)', () => {
  const coords = { latitude: 24.8607, longitude: 67.0011 }; // Karachi
  const date = new Date(Date.UTC(2024, 3, 27));

  it('should shift Sunrise earlier and Maghrib later at high altitude', () => {
    const seaLevelResult = getPrayerTimes({ location: coords, elevation: 0, date });
    const highAltResult = getPrayerTimes({ location: coords, elevation: 4000, date }); // 4000m

    expect(seaLevelResult.success).toBe(true);
    expect(highAltResult.success).toBe(true);

    if (seaLevelResult.success && highAltResult.success) {
      const seaLevelSunrise = seaLevelResult.data.sunrise.getTime();
      const highAltSunrise = highAltResult.data.sunrise.getTime();
      
      const seaLevelMaghrib = seaLevelResult.data.maghrib.getTime();
      const highAltMaghrib = highAltResult.data.maghrib.getTime();

      // At higher altitude, you can see 'further' over the curve of the Earth.
      // Therefore, the sun rises earlier.
      expect(highAltSunrise).toBeLessThan(seaLevelSunrise);
      
      // And sets later.
      expect(highAltMaghrib).toBeGreaterThan(seaLevelMaghrib);
      
      // Dhuhr should not be significantly impacted by horizon dip.
      const dhuhrDiff = Math.abs(highAltResult.data.dhuhr.getTime() - seaLevelResult.data.dhuhr.getTime());
      expect(dhuhrDiff).toBeLessThan(10000); // Less than 10 seconds difference
    }
  });
});
