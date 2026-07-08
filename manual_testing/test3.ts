import { dateToJulianDay, calculateDeltaT } from '../src/astronomy/index.js';
import { localMoonShadow } from '../src/astronomy/phenomena/Eclipse.js';

const jd = 2461265.2338228226;
const observer = { latitude: 64.1466, longitude: -21.9426 };
const deltaT = calculateDeltaT(2026);
const t0 = jd - 0.2;
const t1 = jd + 0.2;

function slope(t: number) {
  const dt = 1.0 / 86400.0;
  const r1 = localMoonShadow(t - dt, observer, deltaT).r;
  const r2 = localMoonShadow(t + dt, observer, deltaT).r;
  return (r2 - r1) / dt;
}

for (let i = 0; i <= 20; i++) {
  const t = t0 + (t1 - t0) * (i / 20);
  const r = localMoonShadow(t, observer, deltaT).r;
  console.log(`t: ${t.toFixed(4)}, r: ${r.toFixed(2)}, slope: ${slope(t).toFixed(2)}`);
}
