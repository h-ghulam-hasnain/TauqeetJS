import { calculatePrayerTimes } from './dist/prayers/index.js';

const locations = [
  { name: 'Karachi', lat: 24.86, lng: 67.00 },
  { name: 'Sydney', lat: -33.87, lng: 151.21 },
  { name: 'London', lat: 51.51, lng: -0.13 },
  { name: 'Moscow', lat: 55.76, lng: 37.62 },
  { name: 'Tromso', lat: 69.65, lng: 18.96 },
  { name: 'Longyearbyen', lat: 78.22, lng: 15.65 }
];

const dates = [
  new Date(Date.UTC(2026, 2, 21)),
  new Date(Date.UTC(2026, 5, 21)),
  new Date(Date.UTC(2026, 8, 21)),
  new Date(Date.UTC(2026, 11, 21))
];

function toMsSinceMidnight(date, tz) {
  if (!date || isNaN(date.getTime())) return null;
  // Modulo in JS can be negative, but times should be positive since we add epoch
  const ms = (date.getTime() + (tz * 3600000)) % 86400000;
  return ms < 0 ? ms + 86400000 : ms;
}

const results = [];

for (const loc of locations) {
  for (const date of dates) {
    try {
      const times = calculatePrayerTimes({
        date: date,
        lat: loc.lat,
        long: loc.lng,
        timeZone: 0,
        method: 'MWL',
        madhab: 'Shafi',
        highLatitudeRule: 'MiddleOfTheNight'
      });
      
      results.push({
        loc: loc.name,
        date: date.toISOString().split('T')[0],
        fajr: toMsSinceMidnight(times.fajr, 0),
        sunrise: toMsSinceMidnight(times.sunrise, 0),
        dhuhr: toMsSinceMidnight(times.dhuhr, 0),
        asr: toMsSinceMidnight(times.asr, 0),
        maghrib: toMsSinceMidnight(times.maghrib, 0),
        isha: toMsSinceMidnight(times.isha, 0)
      });
    } catch (e) {
      console.error(e);
    }
  }
}

import fs from 'fs';
fs.writeFileSync('js_results.json', JSON.stringify(results, null, 2));
console.log("JS Done");
