const { computeSolarPosition } = require('../dist/astronomy/index.cjs');

function adhanJulianCentury(julianDay) {
  return (julianDay - 2451545.0) / 36525;
}
function adhanJulianDay(year, month, day, hours = 0) {
  const trunc = Math.trunc;
  const Y = trunc(month > 2 ? year : year - 1);
  const M = trunc(month > 2 ? month : month + 12);
  const D = day + hours / 24;
  const A = trunc(Y / 100);
  const B = trunc(2 - A + trunc(A / 4));
  const i0 = trunc(365.25 * (Y + 4716));
  const i1 = trunc(30.6001 * (M + 1));
  return i0 + i1 + D + B - 1524.5;
}
function unwindAngle(angle) {
  return angle - 360 * Math.floor(angle / 360);
}
function meanSolarLongitude(T) {
  return unwindAngle(280.4664567 + 36000.76983 * T + 0.0003032 * T * T);
}
function meanSolarAnomaly(T) {
  return unwindAngle(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
}
function solarEquationOfTheCenter(T, meanAnomaly) {
  const Mrad = meanAnomaly * Math.PI / 180;
  return (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
         (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
         0.000289 * Math.sin(3 * Mrad);
}
function apparentSolarLongitude(T, L0) {
  const longitude = L0 + solarEquationOfTheCenter(T, meanSolarAnomaly(T));
  const Omega = 125.04 - 1934.136 * T;
  return unwindAngle(longitude - 0.00569 - 0.00478 * Math.sin(Omega * Math.PI / 180));
}
function meanObliquityOfTheEcliptic(T) {
  return 23.439291 - 0.013004167 * T - 0.0000001639 * T * T + 0.0000005036 * T * T * T;
}
function apparentObliquityOfTheEcliptic(T, Epsilon0) {
  const O = 125.04 - 1934.136 * T;
  return Epsilon0 + 0.00256 * Math.cos(O * Math.PI / 180);
}

function benchmark() {
  const date = new Date(Date.UTC(2026, 6, 9, 12, 0, 0)); // July 9, 2026
  
  // Benchmark adhan-js
  const adhanStart = performance.now();
  let adhanSun;
  for (let i = 0; i < 10000; i++) {
    const jd = adhanJulianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600);
    const T = adhanJulianCentury(jd);
    const L0 = meanSolarLongitude(T);
    const lambda = apparentSolarLongitude(T, L0);
    const epsilon0 = meanObliquityOfTheEcliptic(T);
    const epsilonApp = apparentObliquityOfTheEcliptic(T, epsilon0);
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
  console.log(`tauqeet-js Apparent Longitude: ${tauqeetSun.apparentLongitude}`);
  const diffLong = Math.abs(adhanSun.lambda - tauqeetSun.apparentLongitude);
  console.log(`Difference: ${diffLong.toFixed(5)} degrees (${(diffLong * 3600).toFixed(2)} arcseconds)`);
  
  console.log("");
  console.log(`adhan-js Declination: ${adhanSun.declination}`);
  console.log(`tauqeet-js Declination: ${tauqeetSun.declination}`);
  const diffDec = Math.abs(adhanSun.declination - tauqeetSun.declination);
  console.log(`Difference: ${diffDec.toFixed(5)} degrees (${(diffDec * 3600).toFixed(2)} arcseconds)`);
}

benchmark();
