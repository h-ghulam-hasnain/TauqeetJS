import { describe, it, expect } from 'vitest';
import { getPrayerTimes } from '../../src/prayer/calculate.js';

describe('Extended Test: Madhab Consistency (Asr Calculation)', () => {
  const coords = { latitude: 24.8607, longitude: 67.0011 }; // Karachi
  const date = new Date(Date.UTC(2024, 3, 27));

  it('should ensure Hanafi Asr is always later than Shafi Asr', () => {
    // Shafi uses shadow factor 1 (length of shadow = length of object + noon shadow)
    const shafiResult = getPrayerTimes({ location: coords, madhab: 'Shafi', date });
    
    // Hanafi uses shadow factor 2 (length of shadow = 2 * length of object + noon shadow)
    const hanafiResult = getPrayerTimes({ location: coords, madhab: 'Hanafi', date });

    expect(shafiResult.success).toBe(true);
    expect(hanafiResult.success).toBe(true);

    if (shafiResult.success && hanafiResult.success) {
      const shafiAsr = shafiResult.data.asr.getTime();
      const hanafiAsr = hanafiResult.data.asr.getTime();

      // Because the shadow must be longer, the sun must be lower, thus later in the day.
      expect(hanafiAsr).toBeGreaterThan(shafiAsr);
      
      // Let's verify it's a significant difference (usually 45-60 mins depending on latitude/season)
      const diffMinutes = (hanafiAsr - shafiAsr) / 60000;
      expect(diffMinutes).toBeGreaterThan(30); 
    }
  });
});
