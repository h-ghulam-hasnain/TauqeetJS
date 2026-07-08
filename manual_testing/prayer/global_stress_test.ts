import { calculatePrayerTimes } from '../../dist/index.js';

console.log(`\n=============================================================`);
console.log(`🧪 GLOBAL STRESS TEST: 4 SEASONS, 4 DIVERSE LOCATIONS, 5 MADHABS`);
console.log(`=============================================================`);

const LOCATIONS = [
  { name: 'Faisalabad, Pakistan (Mid-North)', lat: 31.4187, long: 73.0791, tz: 'Asia/Karachi' },
  { name: 'Singapore (Equator)', lat: 1.3521, long: 103.8198, tz: 'Asia/Singapore' },
  { name: 'Sydney, Australia (Mid-South)', lat: -33.8688, long: 151.2093, tz: 'Australia/Sydney' },
  { name: 'Tromsø, Norway (Polar Circle)', lat: 69.6492, long: 18.9553, tz: 'Europe/Oslo' }
];

const DATES = [
  { label: 'March Equinox (2026-03-20)', date: '2026-03-20T12:00:00' },
  { label: 'June Solstice (2026-06-21)', date: '2026-06-21T12:00:00' },
  { label: 'September Equinox (2026-09-22)', date: '2026-09-22T12:00:00' },
  { label: 'December Solstice (2026-12-21)', date: '2026-12-21T12:00:00' }
];

const MADHABS = ['Hanafi', 'Shafi', 'Maliki', 'Hanbali', 'Jaafari'];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const loc of LOCATIONS) {
  console.log(`\n📍 Location: ${loc.name} (${loc.lat}°, ${loc.long}°)`);
  for (const dateObj of DATES) {
    console.log(`  📅 Date: ${dateObj.label}`);
    
    for (const madhab of MADHABS) {
      totalTests++;
      const config = {
        lat: loc.lat,
        long: loc.long,
        timeZone: loc.tz,
        date: new Date(dateObj.date),
        madhab: madhab,
        highLatitudeStrategy: 'AngleBased' // Ensures fallback/strategy logic runs for high latitudes
      };

      try {
        const result = calculatePrayerTimes(config);
        passedTests++;
        
        // Format a short output line showing prayer statuses
        const prayers = ['fajr', 'sunrise', 'dhahwaKubra', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const statuses = prayers.map(p => {
          const field = result[p];
          if (field.status !== 'SUCCESS') {
            return `${p[0].toUpperCase()}:${field.status}`;
          }
          return `${p[0].toUpperCase()}:OK(${field.local.split(' ')[0]})`;
        }).join(' | ');

        console.log(`    ➔ [${madhab.padEnd(7)}]: ${statuses}`);
      } catch (err) {
        failedTests++;
        console.log(`    ❌ [${madhab.padEnd(7)}] FAILED: ${err.message}`);
      }
    }
  }
}

console.log(`\n=============================================================`);
console.log(`📊 SUMMARY RESULTS`);
console.log(`=============================================================`);
console.log(`Total tests run : ${totalTests}`);
console.log(`Passed          : ${passedTests}`);
console.log(`Failed          : ${failedTests}`);
console.log(`=============================================================\n`);
