import { calculatePrayerTimes, getPrayerTimes } from '../../dist/index.js';

// console.log(`\n=============================================================`);
// console.log(`🧪 TEST 1: PRAYER TIMES WITH DEFAULT VALUES`);
// console.log(`=============================================================`);

// Faisalabad coordinates (minimum required inputs)
const config = {
  lat: 82.28,
  long: -62.3,

  // Topographical and climatic corrections
  // elevation: { value: 0, unit: 'meters' },
  temperatureC: 12.714,
  pressureMbar: 1010,
  date: new Date('2026-06-11'),

  timeZone: 1,
};

// console.log(`Config inputs:`);
console.log(JSON.stringify(config, null, 2));

// console.log(`\nCalling calculatePrayerTimes...`);
try {
  const times = calculatePrayerTimes(config);

  // console.log(`\nResults:`);
  for (const [key, value] of Object.entries(times)) {
    if (key === 'metadata') continue;
    console.log(`   ${key.padEnd(15)}: ${value.local} (UTC: ${value.utc}) [Status: ${value.status}]`);
  }

  // console.log(`\nMetadata (Astronomical details):`);
  // console.log(JSON.stringify(times.metadata, null, 2));

} catch (err) {
  console.error(`Calculation Failed:`, err);
}

// console.log(`=============================================================\n`);
