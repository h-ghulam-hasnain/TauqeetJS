import { checkVisibility, VisibilityMethod, checkMultipleCriteria, getSunset } from '../../dist/index.js';

async function runVisibilityTest() {
  console.log("==================================================");
  console.log("🔭 MOON MODULE: VISIBILITY PREDICTION TEST 🔭");
  console.log("==================================================\n");

  // Let's test for Mecca, Saudi Arabia right after a known new moon (April 8, 2024)
  // We will check visibility for the evening of April 9, 2024
  const testDate = new Date('2024-04-09T12:00:00Z');
  const lat = 21.4225;
  const lon = 39.8262;

  console.log(`Testing Date:     ${testDate.toISOString().split('T')[0]}`);
  console.log(`Location:         Mecca (Lat: ${lat}, Lon: ${lon})`);

  const sunset = getSunset(testDate, lat, lon);
  console.log(`Local Sunset:     ${sunset ? sunset.toUTCString() : 'Sun does not set'}\n`);

  console.log("--- Odeh Criterion ---");
  const odehResult = checkVisibility({
    date: testDate,
    latitude: lat,
    longitude: lon,
    method: VisibilityMethod.ODEH
  });
  console.log(`Visible:         ${odehResult.visible}`);
  if (odehResult.details) {
    console.log(`Altitude at SS:  ${odehResult.details.altitude.toFixed(2)}°`);
    console.log(`Elongation:      ${odehResult.details.elongation.toFixed(2)}°`);
    console.log(`Moon Age:        ${odehResult.details.ageHours.toFixed(1)} hours`);
    console.log(`Confidence:      ${(odehResult.confidence * 100).toFixed(0)}%`);
  }
  console.log("");

  console.log("--- Yallop Criterion ---");
  const yallopResult = checkVisibility({
    date: testDate,
    latitude: lat,
    longitude: lon,
    method: VisibilityMethod.YALLOP
  });
  console.log(`Visible:         ${yallopResult.visible}`);
  console.log(`Category:        ${yallopResult.category} (A=Easy, B=Perfect Conditions, C/D=Needs Optical Aid, E/F=Not Visible)`);
  if (yallopResult.details) {
    console.log(`q-value:         ${yallopResult.details.q.toFixed(3)}`);
    console.log(`ARCV:            ${yallopResult.details.arcv.toFixed(2)}°`);
  }
  console.log("");

  console.log("--- Multi-Criteria Evaluation ---");
  const multi = checkMultipleCriteria({
    date: testDate,
    latitude: lat,
    longitude: lon
  });

  multi.forEach(res => {
    console.log(`[${res.criterionName.padEnd(6)}] Visible: ${res.visible.toString().padEnd(5)} | Category/Confidence: ${res.category || (res.confidence * 100).toFixed(0) + '%'}`);
  });
  console.log("");
}

runVisibilityTest().catch(console.error);
