import { getQiblaDirection, getSunAtQibla } from '../../dist/index.js';

// console.log(`\n=============================================================`);
// console.log(`🧭 TEST 2: QIBLA MODULE — ALL PARAMETERS EXHAUSTED`);
// console.log(`=============================================================`);

// ── Section 1: getQiblaDirection ───────────────────────────────────────────
// console.log(`\n── Section 1: getQiblaDirection ──────────────────────────────`);

const directionTests = [
  { name: 'Faisalabad, Pakistan', lat: 31.42388889, lon: 73.05972222 },
  // { name: 'London, UK',              lat:  51.5074,   lon:   -0.1278   },
  // { name: 'New York, USA',           lat:  40.7128,   lon:  -74.0060   },
  // { name: 'Sydney, Australia',       lat: -33.8688,   lon:  151.2093   },
  // { name: 'Reykjavik, Iceland',      lat:  64.1355,   lon:  -21.8954   }, // high latitude
  // { name: 'Buenos Aires, Argentina', lat: -34.6037,   lon:  -58.3816   }, // southern hemisphere
  // { name: 'Vladivostok, Russia',     lat:  43.1332,   lon:  131.9113   }, // far east
];

for (const loc of directionTests) {
  try {
    const { bearing, distanceKm } = getQiblaDirection({ latitude: loc.lat, longitude: loc.lon });
    console.log(`\n  📍 ${loc.name}`);
    console.log(`     Input lat/lon  : ${loc.lat}, ${loc.lon}`);
    console.log(`     Bearing        : ${bearing?.toFixed(6)}°  (great-circle, true north)`);
    console.log(`     Distance       : ${distanceKm.toFixed(2)} km`);
  } catch (err) {
    console.error(`  [${loc.name}] Failed:`, err.message);
  }
}

// ── Section 2: getSunAtQibla ─────────────────────────────────────────────────
console.log(`\n\n── Section 2: sunAtQibla ──────────────────────────────────────`);

const sunTests = [
  {
    name: 'Faisalabad (PKT +5)',
    lat: 31.42388889,
    lon: 73.05972222,
    date: new Date('2023-03-17'),
    timeZone: 5,
  },
];

function fmtDate(qiblaField) {
  if (!qiblaField) return 'null (sun never reaches this azimuth today)';
  return `${qiblaField.time.toISOString()}  (local approx: ${qiblaField.local})`;
}

for (const t of sunTests) {
  try {
    const qiblaDir = getQiblaDirection({ latitude: t.lat, longitude: t.lon });
    // passing +5 for PKT timezone
    const result = getSunAtQibla({ latitude: t.lat, longitude: t.lon, date: t.date, timeZone: 5 });

    console.log(`\n  📍 ${t.name}`);
    console.log(`     Date           : ${t.date.toISOString().slice(0, 10)}`);
    console.log(`     Qibla bearing  : ${qiblaDir.bearing?.toFixed(6)}°`);
    console.log(`     Distance       : ${qiblaDir.distanceKm.toFixed(2)} km`);
    console.log(`\n     Sun × Qibla events:`);
    console.log(`       qiblaAlignment:                 ${fmtDate(result.qiblaAlignment)}`);
    console.log(`       antiQiblaAlignment:             ${fmtDate(result.antiQiblaAlignment)}`);
    console.log(`       rightPerpendicularAlignment:    ${fmtDate(result.rightPerpendicularAlignment)}`);
    console.log(`       leftPerpendicularAlignment:     ${fmtDate(result.leftPerpendicularAlignment)}`);
  } catch (err) {
    console.error(`  [${t.name}] Failed:`, err.message);
  }
}
