import { norm360, sind, cosd, acosd, norm24 } from '../core/math.js';
import { Astronomy } from './index.js';

export interface RiseSetResult {
  rise?: Date;
  set?: Date;
  transit?: Date;
}

/**
 * Calculates Rise, Set, and Transit for a celestial body using iterative successive approximation.
 * Following Meeus, Astronomical Algorithms Chapter 15.
 */
export function calculateRiseSet(
  date: Date,
  lat: number,
  lng: number,
  type: 'sun' | 'moon'
): RiseSetResult {
  const result: RiseSetResult = {};
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  
  // 1. Get initial positions for the day center (12h UTC)
  const noon = new Date(day);
  noon.setUTCHours(12, 0, 0, 0);
  const astroNoon = new Astronomy(noon);
  
  // Determine h0 (Altitude at horizon)
  let h0: number;
  if (type === 'sun') {
    const sun = astroNoon.sun;
    const refraction = 34 / 60; // Standard 34'
    // User requested formula: 90 + Ref + SD - HP as Zenith
    // h0 = 90 - Z = -(Ref + SD - HP)
    h0 = -(refraction + sun.SD / 3600 - sun.HP / 3600);
  } else {
    // User requested -0.833 for Moon
    h0 = -0.833;
  }

  // Initial approximation for transit (m0)
  // m0 = (alpha + L - GHA0) / 360
  // Simplified for this context:
  const pos0 = type === 'sun' ? astroNoon.sun : astroNoon.moon;
  let m0 = (pos0.RA + lng - pos0.GHA - pos0.RA) / 360; // Placeholder logic
  
  // Let's use a more robust iterative approach
  // We search for h(t) = h0
  
  const getAlt = (t_hours: number) => {
    const time = new Date(day.getTime() + t_hours * 3600000);
    const astro = new Astronomy(time);
    const pos = type === 'sun' ? astro.sun : astro.moon;
    
    // GHA of body at this time is already computed in Astronomy
    // Local Hour Angle: LHA = GHA - WestLongitude (or GHA + EastLongitude)
    const LHA = norm360(pos.GHA - lng); // lng is West is negative usually? 
    // Wait, check lng convention. In math.ts/time.ts, lng is often East positive.
    // If lng is East positive, LHA = GHA + lng
    const lha = norm360(pos.GHA + lng);
    
    const alt = acosd(sind(lat) * sind(pos.DEC) + cosd(lat) * cosd(pos.DEC) * cosd(lha));
    // acosd returns [0, 180], where 0 is zenith.
    return 90 - alt;
  };

  // Iterative solver for Transit (Solar Noon / Lunar Transit)
  let tTransit = 12;
  for (let i = 0; i < 3; i++) {
    const time = new Date(day.getTime() + tTransit * 3600000);
    const astro = new Astronomy(time);
    const pos = type === 'sun' ? astro.sun : astro.moon;
    const lha = norm360(pos.GHA + lng);
    const diff = lha > 180 ? lha - 360 : lha;
    tTransit -= diff / 15;
  }
  result.transit = new Date(day.getTime() + tTransit * 3600000);

  // Successive approximation for Rise and Set
  const solveForAlt = (targetAlt: number, startHour: number): number | undefined => {
    let t = startHour;
    for (let i = 0; i < 5; i++) {
      const time = new Date(day.getTime() + t * 3600000);
      const astro = new Astronomy(time);
      const pos = type === 'sun' ? astro.sun : astro.moon;
      const lha = norm360(pos.GHA + lng);
      
      const cosH = (sind(targetAlt) - sind(lat) * sind(pos.DEC)) / (cosd(lat) * cosd(pos.DEC));
      if (Math.abs(cosH) > 1) return undefined; // Body never rises/sets
      
      const H = acosd(cosH);
      const targetLHA = startHour < 12 ? 360 - H : H;
      let diff = lha - targetLHA;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      
      t -= diff / 15;
    }
    return t;
  };

  const tRise = solveForAlt(h0, (tTransit - 6 + 24) % 24);
  const tSet = solveForAlt(h0, (tTransit + 6 + 24) % 24);

  if (tRise !== undefined) result.rise = new Date(day.getTime() + tRise * 3600000);
  if (tSet !== undefined) result.set = new Date(day.getTime() + tSet * 3600000);

  return result;
}
