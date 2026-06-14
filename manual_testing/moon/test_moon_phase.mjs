import {
  getMoonPhase,
  getMoonAge,
  getMoonIllumination,
  getNextNewMoon,
  getPreviousNewMoon,
  getNextFullMoon
} from '../../dist/index.js';

// We use an async IIFE to allow top-level await like behavior if needed,
// though we can also just run it procedurally.
async function runTests() {
  console.log("==================================================");
  console.log("🌙 MOON MODULE: MANUAL PHASE & EVENTS TEST 🌙");
  console.log("==================================================\n");

  const today = new Date();
  console.log(`Current Date Context: ${today.toUTCString()}\n`);

  // 1. Phase and Illumination
  const phase = getMoonPhase(today);
  const illumination = getMoonIllumination(today);

  console.log("--- Current Moon Status ---");
  console.log(`Phase Name:          ${phase.phaseName}`);
  console.log(`Elongation:          ${phase.elongation.toFixed(2)}°`);
  console.log(`Illuminated Frac:    ${(illumination * 100).toFixed(1)}%`);

  // 2. Age
  const age = getMoonAge(today);
  console.log(`Moon Age:            ${age.ageDays.toFixed(2)} days`);
  console.log(`Prev New Moon was:   ${age.previousNewMoon.toUTCString()}\n`);

  // 3. Events
  console.log("--- Upcoming Lunar Events ---");
  const nextNew = getNextNewMoon(today);
  const nextFull = getNextFullMoon(today);
  const prevNew = getPreviousNewMoon(today);

  console.log(`Last New Moon:       ${prevNew.toUTCString()}`);
  console.log(`Next New Moon:       ${nextNew.toUTCString()}`);
  console.log(`Next Full Moon:      ${nextFull.toUTCString()}\n`);
}

runTests().catch(console.error);
