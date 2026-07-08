import { calculatePrayerTimes } from '../../dist/index.js';

console.log(`\n=============================================================`);
console.log(`🧪 TEST 2: PRAYER TIMES WITH ALL PARAMETERS EXHAUSTED`);
console.log(`=============================================================`);

const config = {
  // Test DMS parsing for high latitude (London)
  // lat: "51°30'26\"N",
  // long: "0°07'39\"W",

  lat: 31.4187,
  long: 73.0791,

  // Specific date and timezone
  date: new Date('2026-06-06T12:00:00Z'),
  timeZone: 'Europe/London',

  // Method and Madhab selection
  method: 'ISNA',
  madhab: 'Shafi',

  // Topographical and climatic corrections
  elevation: { value: 35, unit: 'meters' },
  temperatureC: 15,
  pressureMbar: 1010,

  // High latitude edge-case handling
  highLatitudeStrategy: 'SeventhOfNight',
  regionalFallbackLatitude: 45,

  // Fine-tuning offsets
  adjustments: {
    fajr: 2,   // Add 2 mins
    isha: -2   // Subtract 2 mins
  },

  // Enable detailed astronomical data output
  withMetadata: true
};

console.log(`Config inputs:`);
console.log(JSON.stringify(config, null, 2));

console.log(`\nCalling calculatePrayerTimes...`);
try {
  const times = calculatePrayerTimes(config);

  console.log(`\nResults:`);
  for (const [key, value] of Object.entries(times)) {
    if (key === 'metadata') continue;
    console.log(`   ${key.padEnd(15)}: ${value.local} (UTC: ${value.utc}) [Status: ${value.status}]`);
  }

  console.log(`\nMetadata (Astronomical details):`);
  console.log(JSON.stringify(times.metadata, null, 2));

} catch (err) {
  console.error(`Calculation Failed:`, err);
}

console.log(`=============================================================\n`);
