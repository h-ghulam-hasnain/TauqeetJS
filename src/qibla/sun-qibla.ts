import { sind, cosd, acosd, atan2d, norm360 } from '../core/math.js';
import { Astronomy } from '../astronomy/index.js';
import { PrayerEngine } from '../prayer/engine.js';
import { calculateQibla } from './index.js';

/**
 * Calculates the Polar Angle P for a spherical triangle.
 * Used to find the time offset from solar noon.
 */
function calculatePolarAngleP(PZdeg: number, PSdeg: number, Zdeg: number) {
  const c = PZdeg;
  const b = PSdeg;
  const B = Zdeg;

  const sinC = sind(c);
  const cosC = cosd(c);
  const sinBside = sind(b);
  const cosBside = cosd(b);

  const R = Math.hypot(cosC, sinC * cosd(B));
  if (R < 1e-12) return { angleP: NaN, sideZS: NaN };

  let x = cosBside / R;
  x = Math.min(1, Math.max(-1, x));

  const alpha = atan2d(sinC * cosd(B), cosC);
  const delta = acosd(x);

  const candidateSides = [alpha + delta, alpha - delta]
    .map(norm360)
    .filter((a) => a >= -1e-12 && a <= 180 + 1e-12);

  if (candidateSides.length === 0) return { angleP: NaN, sideZS: NaN };

  const a = candidateSides[0];
  const denom = sinBside * sinC;
  if (Math.abs(denom) < 1e-12) return { angleP: NaN, sideZS: NaN };

  let cosP = (cosd(a) - cosBside * cosC) / denom;
  cosP = Math.min(1, Math.max(-1, cosP));

  return {
    angleP: acosd(cosP),
    sideZS: a,
  };
}

/**
 * Calculates when the Sun will be at the Qibla direction, opposite, and sides.
 * 
 * @param lat - Latitude of the observer
 * @param lng - Longitude of the observer
 * @param date - Optional date (defaults to today)
 * @returns Array of objects with times when the sun aligns with Qibla directions
 */
export function calculateSunAtQibla(lat: number, lng: number, date: Date = new Date()) {
  // 1. Get Qibla Direction (BASE_DIR)
  const qiblaInfo = calculateQibla({ latitude: lat, longitude: lng });
  const baseDir = qiblaInfo.bearing;

  // 2. Get Zuhr Time (Solar Noon)
  const engine = new PrayerEngine({ latitude: lat, longitude: lng });
  const prayerTimes = engine.calculate(date);
  const zuhrDate = prayerTimes.dhuhr;
  
  // Use UTC decimal hours for calculation
  const zuhrDecimal = zuhrDate.getUTCHours() + zuhrDate.getUTCMinutes() / 60 + zuhrDate.getUTCSeconds() / 3600;

  // 3. Get Solar Declination (SunDec) at Zuhr time
  const astro = new Astronomy(zuhrDate);
  const sunDec = astro.sun.DEC;

  // Parameters for spherical triangle
  const PZ = 90 - lat;
  const PS = 90 - sunDec;

  const offsets = [
    { name: 'Qibla', value: 0 },
    { name: 'Opposite', value: 180 },
    { name: 'Right', value: 90 },
    { name: 'Left', value: -90 }
  ] as const;

  const results: { direction: string; bearing: number; time: Date }[] = [];

  offsets.forEach((offset) => {
    const currentDir = norm360(baseDir + offset.value);
    const { angleP } = calculatePolarAngleP(PZ, PS, currentDir);

    if (!isNaN(angleP)) {
      const timeOffset = angleP / 15;
      
      /**
       * Logic: 
       * Azimuth < 180 (East-ish): Sun is in the morning (Before Zuhr)
       * Azimuth > 180 (West-ish): Sun is in the afternoon (After Zuhr)
       */
      const finalTimeDecimal = currentDir > 180 ? zuhrDecimal + timeOffset : zuhrDecimal - timeOffset;
      
      const time = new Date(zuhrDate);
      const hours = Math.floor(finalTimeDecimal);
      const minutes = Math.floor((finalTimeDecimal - hours) * 60);
      const seconds = Math.floor(((finalTimeDecimal - hours) * 60 - minutes) * 60);
      
      time.setUTCHours(hours, minutes, seconds);

      results.push({
        direction: offset.name,
        bearing: currentDir,
        time: time
      });
    }
  });

  return results;
}
