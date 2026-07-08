import { dateToJulianDay } from '../src/astronomy/index.js';
import { searchLocalSolarEclipse } from '../src/astronomy/phenomena/Eclipse.js';

const jd = dateToJulianDay(2026, 1, 1);
const observer = { latitude: 64.1466, longitude: -21.9426 };

try {
  const localInfo = searchLocalSolarEclipse(jd, observer);
  console.log(JSON.stringify(localInfo, null, 2));
} catch (e) {
  console.error(e);
}
