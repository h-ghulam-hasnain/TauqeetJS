import { describe, it } from 'vitest';
import { computeSolarPosition, dateToJulianDay } from '../src/astronomy/index.js';
import Astronomical from '../helpers/adhan-js/src/Astronomical.js';

describe('Benchmark adhan-js vs tauqeet-js', () => {
  it('should compare speed and accuracy', () => {
    const date = new Date(Date.UTC(2026, 6, 9, 12, 0, 0)); // July 9, 2026
    
    // Benchmark adhan-js
    const adhanStart = performance.now();
    let adhanSun;
    for (let i = 0; i < 10000; i++) {
      const jd = Astronomical.julianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600);
      const T = Astronomical.julianCentury(jd);
      const L0 = Astronomical.meanSolarLongitude(T);
      const lambda = Astronomical.apparentSolarLongitude(T, L0);
      const epsilon0 = Astronomical.meanObliquityOfTheEcliptic(T);
      const epsilonApp = Astronomical.apparentObliquityOfTheEcliptic(T, epsilon0);
      // Simple declination calculation
      const declination = Math.asin(Math.sin(epsilonApp * Math.PI / 180) * Math.sin(lambda * Math.PI / 180)) * 180 / Math.PI;
      adhanSun = { lambda, declination };
    }
    const adhanEnd = performance.now();
    
    // Benchmark tauqeet-js
    const tauqeetStart = performance.now();
    let tauqeetSun;
    for (let i = 0; i < 10000; i++) {
      tauqeetSun = computeSolarPosition(date);
    }
    const tauqeetEnd = performance.now();

    console.log("=== PERFORMANCE (10,000 iterations) ===");
    console.log(`adhan-js: ${(adhanEnd - adhanStart).toFixed(2)} ms`);
    console.log(`tauqeet-js: ${(tauqeetEnd - tauqeetStart).toFixed(2)} ms`);
    console.log("");
    
    console.log("=== ACCURACY / PRECISION ===");
    console.log("Date: " + date.toISOString());
    console.log(`adhan-js Apparent Longitude: ${adhanSun.lambda}`);
    console.log(`tauqeet-js Apparent Longitude: ${tauqeetSun!.apparentLongitude}`);
    const diffLong = Math.abs(adhanSun.lambda - tauqeetSun!.apparentLongitude);
    console.log(`Difference: ${diffLong.toFixed(5)} degrees (${(diffLong * 3600).toFixed(2)} arcseconds)`);
    
    console.log("");
    console.log(`adhan-js Declination: ${adhanSun.declination}`);
    console.log(`tauqeet-js Declination: ${tauqeetSun!.declination}`);
    const diffDec = Math.abs(adhanSun.declination - tauqeetSun!.declination);
    console.log(`Difference: ${diffDec.toFixed(5)} degrees (${(diffDec * 3600).toFixed(2)} arcseconds)`);
  });
});
