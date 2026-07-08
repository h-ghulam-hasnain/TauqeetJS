import { getQiblaDirection, getSunAtQibla } from '../../dist/index.js';

// console.log(`\n=============================================================`);
// console.log(`🧭 TEST 1: QIBLA DIRECTION — DEFAULT / MINIMAL INPUT`);
// console.log(`=============================================================`);

// ── Test locations ─────────────────────────────────────────────────────────
const locations = [
  { name: 'Faisalabad, Pakistan', lat: 31.39965, lon: 73.02003 },
  // { name: 'London, UK',              lat: 51.5074,    lon:  -0.1278   },
  // { name: 'New York, USA',           lat: 40.7128,    lon: -74.0060   },
  // { name: 'Sydney, Australia',       lat: -33.8688,   lon: 151.2093   },
  // { name: 'Cape Town, South Africa', lat: -33.9249,   lon:  18.4241   },
  // { name: 'Tokyo, Japan',            lat:  35.6762,   lon: 139.6503   },
  // { name: 'Mecca (self)',            lat:  21.4224870, lon:  39.826206 }, // ~0 km
];

console.log(`\n${'Location'.padEnd(30)} ${'Bearing (°)'.padEnd(14)} ${'Rhumb (°)'.padEnd(12)} Distance (km)`);
console.log('─'.repeat(75));

for (const loc of locations) {
  try {
    const qiblaDir = getQiblaDirection({ latitude: loc.lat, longitude: loc.lon });
    console.log(`Qibla Bearing: ${qiblaDir.bearing?.toFixed(4)}°`);
    console.log(`Distance:      ${qiblaDir.distanceKm.toFixed(2)} km`);

    console.log('\n2. Calculating Sun Alignments at default Date (Now)');
    const sunAlign = getSunAtQibla({ latitude: loc.lat, longitude: loc.lon, timeZone: 5 });
  } catch (err) {
    console.error(`  [${loc.name}] Failed:`, err.message);
  }
}

// ── Edge-case: invalid coordinates ─────────────────────────────────────────
console.log(`\n── Edge Cases ──`);
const edgeCases = [
  { name: 'Lat out of range', lat: 100, lon: 0 },
  { name: 'Lon out of range', lat: 0, lon: 200 },
  { name: 'NaN latitude', lat: NaN, lon: 0 },
];

for (const ec of edgeCases) {
  try {
    getQiblaDirection({ latitude: ec.lat, longitude: ec.lon });
    console.log(`  [${ec.name}] ❌ Should have thrown`);
  } catch (err) {
    console.log(`  [${ec.name}] ✅ Threw correctly: ${err.message}`);
  }
}

// console.log(`\n=============================================================\n`);
