import { calculatePrayerTimes } from '../../dist/index.js';

// console.log(`\n=============================================================`);
// console.log(`🧪 TEST 1: PRAYER TIMES WITH DEFAULT VALUES`);
// console.log(`=============================================================`);

// Faisalabad coordinates (minimum required inputs)
// South-West Corner: 31.3356° N, 72.9938° E
// North-East Corner: 31.5264° N, 73.1930° E
// Center-city: 31.4187° N, 73.0791° E
const config = {
  // South-West
  lat: 31.3356,
  long: 72.9938,

  // North-East Corner
  // lat: 31.5264,
  // long: 73.1930,

  // Center-city
  // lat: 31.4187,
  // long: 73.0791,


  // Topographical and climatic corrections
  // elevation: { value: 0, unit: 'meters' },
  // temperatureC: 12.714,
  // pressureMbar: 1010,
  date: new Date('2027-01-01'),

  timeZone: 5,
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
