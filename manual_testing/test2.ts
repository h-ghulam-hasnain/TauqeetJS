import { dateToJulianDay, calculateDeltaT } from '../src/astronomy/index.js';

const jd = 2461265.2338228226;
const observer = { latitude: 64.1466, longitude: -21.9426 };
const deltaT = calculateDeltaT(2026);
const t0 = jd - 0.2;
const t1 = jd + 0.2;

// getLocalMoonShadowSlope is not exported, so we just calculate it here
import { localMoonShadow } from '../src/astronomy/phenomena/Eclipse.js';
function slope(t: number) {
  const dt = 1.0 / 86400.0;
  const r1 = localMoonShadow(t - dt, observer, deltaT).r;
  const r2 = localMoonShadow(t + dt, observer, deltaT).r;
  return (r2 - r1) / dt;
}

console.log("Slope at t0:", slope(t0));
console.log("Slope at t1:", slope(t1));
