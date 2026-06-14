import type { PrayerMethodConfig } from '../types/index.js';

export const BUILT_IN_METHODS: Record<string, PrayerMethodConfig> = {
  MWL: { id: 'MWL', name: 'Muslim World League', fajrAngle: 18, ishaAngle: 17, source: 'MWL' },
  ISNA: { id: 'ISNA', name: 'Islamic Society of North America', fajrAngle: 15, ishaAngle: 15, source: 'ISNA' },
  Egypt: { id: 'Egypt', name: 'Egyptian General Authority of Survey', fajrAngle: 19.5, ishaAngle: 17.5, source: 'EGAS' },
  Makkah: { id: 'Makkah', name: 'Umm al-Qura University, Makkah', fajrAngle: 18.5, ishaAngle: null, ishaMinutes: 90, source: 'UAQ' },
  UmmAlQura: { id: 'UmmAlQura', name: 'Umm al-Qura University, Makkah', fajrAngle: 18.5, ishaAngle: null, ishaMinutes: 90, source: 'UAQ' },
  Karachi: { id: 'Karachi', name: 'University of Islamic Sciences, Karachi', fajrAngle: 18, ishaAngle: 18, source: 'UISK' },
  Tehran: { id: 'Tehran', name: 'Institute of Geophysics, University of Tehran', fajrAngle: 17.7, ishaAngle: 14, maghribAngle: 4.5, source: 'IGUT' },
  Jafari: { id: 'Jafari', name: 'Shia Ithna-Ashari, Leva Institute, Qum', fajrAngle: 16, ishaAngle: 14, maghribAngle: 4, source: 'LILQ' }
};
