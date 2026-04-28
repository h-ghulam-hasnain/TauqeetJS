import { sind, cosd, acosd, atan2d, norm360 } from '../core/math.js';
import { calculateSolar } from '../astronomy/solar.js';
import { calculateNutation } from '../astronomy/nutation.js';
import { getJulianDate } from '../core/time.js';
import { createPrayerEngine } from '../prayer/engine/index.js';
import { calculateQibla } from './index.js';
import { Result, Success, Failure, validateInputs } from '../core/result.js';

/**
 * Calculates the Polar Angle P for a spherical triangle.
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
 */
export function calculateSunAtQibla(
  lat: number, 
  lng: number, 
  date: Date = new Date(),
  elevation: number = 0,
  temperature: number = 10,
  pressure: number = 1010
): Result<{ direction: string; bearing: number; time: Date }[]> {
  const validation = validateInputs(lat, lng, date);
  if (!validation.success) return Failure(validation.error);

  // 1. Get Qibla Direction
  const qiblaResult = calculateQibla({ latitude: lat, longitude: lng });
  if (!qiblaResult.success) return Failure(qiblaResult.error);
  const baseDir = qiblaResult.data.bearing;

  // 2. Get Zuhr Time (Solar Noon)
  const engine = createPrayerEngine({ latitude: lat, longitude: lng, elevation });
  const prayerTimesResult = engine.calculate(date, 2, temperature, pressure);
  if (!prayerTimesResult.success) return Failure(prayerTimesResult.error);
  const zuhrDate = prayerTimesResult.data.dhuhr;

  const zuhrDecimal = zuhrDate.getUTCHours() + zuhrDate.getUTCMinutes() / 60 + zuhrDate.getUTCSeconds() / 3600;

  // 3. Get Solar Declination at Zuhr time
  const jd = getJulianDate(zuhrDate);
  const te = (jd - 2451545) / 36525;
  const nut = calculateNutation(te);
  const solar = calculateSolar(jd, nut.deltaPsi, nut.eps, te, 0.1 * te, te);
  const sunDec = solar.DEC;

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

  return Success(results);
}
