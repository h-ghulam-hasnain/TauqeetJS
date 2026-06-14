import {
  dateToJulianDay,
  calculateDeltaT,
  computeSolarPosition,
  computeLunarPosition,
  computeLunarPhase,
  computeNextNewMoon,
  computePreviousNewMoon,
  computeNextFullMoon,
} from '../dist/index.js';

/**
 * Test harness for Sun and Moon ephemeris data
 * Displays: Declination, Semidiameter, Horizontal Parallax, Equation of Time
 */

function formatDegrees(deg) {
  const sign = deg < 0 ? '−' : '+';
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d - m / 60) * 3600).toFixed(1);
  return `${sign}${d.toString().padStart(2, '0')}°${m.toString().padStart(2, '0')}'${s.padStart(4, '0')}"`;
}

function formatArcsec(arcsec) {
  return `${arcsec.toFixed(2)}"`;
}

function formatTime(minutes) {
  const sign = minutes < 0 ? '−' : '+';
  const absMin = Math.abs(minutes);
  const h = Math.floor(absMin / 60);
  const m = Math.floor(absMin % 60);
  const s = ((absMin - h * 60 - m) * 60).toFixed(1);
  return `${sign}${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.padStart(4, '0')}s`;
}

function testEphemeris({ year, month, day, hour = 0, minute = 0, second = 0 }) {
  const j = dateToJulianDay(year, month, day);
  const ut = hour + minute / 60 + second / 3600;
  const deltaT = calculateDeltaT(year);

  const sun = computeSolarPosition(j, ut, deltaT);
  const moon = computeLunarPosition(j, ut, deltaT);
  const phase = computeLunarPhase(j, ut, deltaT);

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} UTC`;

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📅 ${dateStr} ${timeStr}`);
  console.log(`   ΔT = ${deltaT.toFixed(2)}s`);
  console.log(`${'═'.repeat(70)}`);

  console.log(`\n☀️  SUN`);
  console.log(`   Declination:         ${formatDegrees(sun.declination)}`);
  console.log(`   Semidiameter:        ${formatArcsec(sun.semidiameter)}`);
  console.log(`   Horizontal Parallax: ${formatArcsec(sun.horizontalParallax)}`);
  console.log(`   Equation of Time:    ${formatTime(sun.equationOfTime)}`);

  console.log(`\n🌙 MOON`);
  console.log(`   Declination:         ${formatDegrees(moon.declination)}`);
  console.log(`   Semidiameter:        ${formatArcsec(moon.semidiameter)}`);
  console.log(`   Horizontal Parallax: ${formatArcsec(moon.horizontalParallax)}`);
  console.log(`   Illumination:        ${(moon.illuminationFraction * 100).toFixed(1)}%`);

  console.log(`\n📐 LUNAR PHASE`);
  console.log(`   Elongation:          ${phase.elongation.toFixed(2)}°`);
  console.log(`   Illuminated Fraction: ${(phase.illuminatedFraction * 100).toFixed(1)}%`);
}

function testLunarEvents() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🌙 LUNAR EVENTS TEST`);
  console.log(`${'═'.repeat(70)}`);

  const testDate = { year: 2026, month: 6, day: 5 };
  const j = dateToJulianDay(testDate.year, testDate.month, testDate.day);
  const deltaT = calculateDeltaT(testDate.year);

  const nextNewMoon = computeNextNewMoon(j, deltaT);
  const prevNewMoon = computePreviousNewMoon(j, deltaT);
  const nextFullMoon = computeNextFullMoon(j, deltaT);

  console.log(`\nFrom: 2026-06-05 00:00:00 UTC`);
  console.log(`\n⊕ Next New Moon:`);
  console.log(`   ${nextNewMoon.year}-${String(nextNewMoon.month).padStart(2, '0')}-${String(nextNewMoon.day).padStart(2, '0')} ${String(nextNewMoon.hour).padStart(2, '0')}:${String(nextNewMoon.minute).padStart(2, '0')}:${String(nextNewMoon.second).padStart(2, '0')} UTC`);
  console.log(`   JD = ${nextNewMoon.julianDay.toFixed(6)}`);

  console.log(`\n⊖ Previous New Moon:`);
  console.log(`   ${prevNewMoon.year}-${String(prevNewMoon.month).padStart(2, '0')}-${String(prevNewMoon.day).padStart(2, '0')} ${String(prevNewMoon.hour).padStart(2, '0')}:${String(prevNewMoon.minute).padStart(2, '0')}:${String(prevNewMoon.second).padStart(2, '0')} UTC`);
  console.log(`   JD = ${prevNewMoon.julianDay.toFixed(6)}`);

  console.log(`\n◐ Next Full Moon:`);
  console.log(`   ${nextFullMoon.year}-${String(nextFullMoon.month).padStart(2, '0')}-${String(nextFullMoon.day).padStart(2, '0')} ${String(nextFullMoon.hour).padStart(2, '0')}:${String(nextFullMoon.minute).padStart(2, '0')}:${String(nextFullMoon.second).padStart(2, '0')} UTC`);
  console.log(`   JD = ${nextFullMoon.julianDay.toFixed(6)}`);

  // Calculate moon age
  const moonAge = j - prevNewMoon.julianDay;
  console.log(`\n📅 Moon Age (from previous New Moon):`);
  console.log(`   ${moonAge.toFixed(2)} days`);
}

// Test dates
const testDates = [
  { year: 2026, month: 6, day: 5, hour: 0, minute: 0, second: 0 },  // J2000 epoch nearby
  // { year: 2024, month: 3, day: 1, hour: 12, minute: 0, second: 0 }, // Spring equinox
  // { year: 2000, month: 1, day: 1, hour: 0, minute: 0, second: 0 },  // Y2K
  // { year: 2026, month: 12, day: 21, hour: 18, minute: 30, second: 0 }, // Winter solstice
];

console.log(`\n${'╔' + '═'.repeat(68) + '╗'}`);
console.log(`║ ${' '.repeat(15)}TypeScript Astronomy Module - Test║`);
console.log(`║ ${' '.repeat(10)}Sun & Moon Ephemeris Comparison║`);
console.log(`╚${'═'.repeat(68)}╝`);

for (const date of testDates) {
  testEphemeris(date);
}

testLunarEvents();

console.log(`\n${'═'.repeat(70)}\n`);
