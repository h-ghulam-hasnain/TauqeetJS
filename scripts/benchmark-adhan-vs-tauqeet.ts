import { performance } from 'perf_hooks';
import v8 from 'v8';
import * as adhan from 'adhan';
import { getVSOP87Tables } from '../src/astronomy/loader.js';
import { calculatePrayerTimes } from '../src/prayers/index.js';

// Configuration
const LOCATIONS = [
  { name: 'London (Mid-Latitude)', lat: 51.5074, lng: -0.1278 },
  { name: 'Tromsø (Extreme Latitude)', lat: 69.6492, lng: 18.9560 }
];

const START_DATE = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
const DAYS_TO_TEST = 365;

async function runDriftTest() {
  console.log('\n==================================================');
  console.log('1. MATHEMATICAL DRIFT & PRECISION PROFILING');
  console.log('==================================================');

  await getVSOP87Tables(); // Preload engine

  for (const loc of LOCATIONS) {
    console.log(`\nLocation: ${loc.name} [${loc.lat}, ${loc.lng}]`);
    let totalDriftFajr = 0, totalDriftMaghrib = 0;
    let maxDriftFajr = 0, maxDriftMaghrib = 0;
    let count = 0;

    for (let i = 0; i < DAYS_TO_TEST; i++) {
      const date = new Date(START_DATE.getTime() + i * 86400000);
      
      // Adhan-JS Calculation
      const adhanCoords = new adhan.Coordinates(loc.lat, loc.lng);
      const adhanParams = adhan.CalculationMethod.MuslimWorldLeague();
      // Use adhan's recommended or default high latitude rule
      // adhanParams.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight;
      
      const adhanTimes = new adhan.PrayerTimes(adhanCoords, date, adhanParams);

      // Tauqeet-JS Calculation
      const tauqeetTimes = calculatePrayerTimes({
        lat: loc.lat,
        long: loc.lng,
        date: date,
        method: 'MWL',
        timeZone: 'UTC',
        highLatitudeStrategy: 'SeventhOfNight' // Standard fallback to prevent hard fails
      });

      // We only compare if both engines successfully found a time
      if (tauqeetTimes.fajr.timestamp && adhanTimes.fajr) {
        const delta = Math.abs(tauqeetTimes.fajr.timestamp - (adhanTimes.fajr.getTime() / 1000));
        totalDriftFajr += delta;
        if (delta > maxDriftFajr) maxDriftFajr = delta;
        count++;
      }
      
      if (tauqeetTimes.maghrib.timestamp && adhanTimes.maghrib) {
        const delta = Math.abs(tauqeetTimes.maghrib.timestamp - (adhanTimes.maghrib.getTime() / 1000));
        totalDriftMaghrib += delta;
        if (delta > maxDriftMaghrib) maxDriftMaghrib = delta;
      }
    }

    if (count > 0) {
      console.log(`Fajr Drift    | Mean: ${(totalDriftFajr / count).toFixed(2)}s | Max: ${maxDriftFajr.toFixed(2)}s`);
      console.log(`Maghrib Drift | Mean: ${(totalDriftMaghrib / count).toFixed(2)}s | Max: ${maxDriftMaghrib.toFixed(2)}s`);
    } else {
      console.log(`No valid comparable times found (likely extreme latitude fallback rules bypassed).`);
    }
  }
}

async function runThroughputTest() {
  console.log('\n==================================================');
  console.log('2. RUNTIME THROUGHPUT & OPS/SEC BENCHMARK');
  console.log('==================================================');

  const ITERATIONS = 10000; // Scaled to 10k for reasonable console output time
  const loc = LOCATIONS[0];
  const date = START_DATE;

  const adhanCoords = new adhan.Coordinates(loc.lat, loc.lng);
  const adhanParams = adhan.CalculationMethod.MuslimWorldLeague();

  const tauqeetConfig = {
    lat: loc.lat,
    long: loc.lng,
    date: date,
    method: 'MWL',
    timeZone: 'UTC'
  };

  // Warmup V8 JIT
  for (let i = 0; i < 1000; i++) {
    new adhan.PrayerTimes(adhanCoords, date, adhanParams);
    calculatePrayerTimes(tauqeetConfig);
  }

  // Measure Adhan
  let start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    new adhan.PrayerTimes(adhanCoords, date, adhanParams);
  }
  let end = performance.now();
  const adhanTimeMs = end - start;
  const adhanOpsSec = (ITERATIONS / (adhanTimeMs / 1000)).toFixed(0);
  const adhanLatency = ((adhanTimeMs / ITERATIONS) * 1000).toFixed(2);

  // Measure Tauqeet
  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    calculatePrayerTimes(tauqeetConfig);
  }
  end = performance.now();
  const tauqeetTimeMs = end - start;
  const tauqeetOpsSec = (ITERATIONS / (tauqeetTimeMs / 1000)).toFixed(0);
  const tauqeetLatency = ((tauqeetTimeMs / ITERATIONS) * 1000).toFixed(2);

  console.log(`[Adhan-JS]   Throughput: ${adhanOpsSec} ops/sec | Avg Latency: ${adhanLatency} μs/op`);
  console.log(`[Tauqeet-JS] Throughput: ${tauqeetOpsSec} ops/sec | Avg Latency: ${tauqeetLatency} μs/op`);
}

async function runMemoryTest() {
  console.log('\n==================================================');
  console.log('3. MEMORY ALLOCATION & GC CHARACTERIZATION');
  console.log('==================================================');

  if (!global.gc) {
    console.warn('WARNING: Script must be run with --expose-gc to collect accurate heap statistics.');
    console.warn('Run via: node --expose-gc -r ts-node/register scripts/benchmark.ts');
    return;
  }

  const ITERATIONS = 100000;
  const loc = LOCATIONS[0];
  const date = START_DATE;
  
  const adhanCoords = new adhan.Coordinates(loc.lat, loc.lng);
  const adhanParams = adhan.CalculationMethod.MuslimWorldLeague();
  
  const tauqeetConfig = {
    lat: loc.lat,
    long: loc.lng,
    date: date,
    method: 'MWL',
    timeZone: 'UTC'
  };

  // Test Adhan-JS Memory
  global.gc();
  const adhanMemBefore = process.memoryUsage().heapUsed;
  for (let i = 0; i < ITERATIONS; i++) {
    new adhan.PrayerTimes(adhanCoords, date, adhanParams);
  }
  const adhanMemAfter = process.memoryUsage().heapUsed;
  const adhanMemDeltaMb = ((adhanMemAfter - adhanMemBefore) / 1024 / 1024).toFixed(2);

  // Test Tauqeet-JS Memory
  global.gc();
  const tauqeetMemBefore = process.memoryUsage().heapUsed;
  for (let i = 0; i < ITERATIONS; i++) {
    calculatePrayerTimes(tauqeetConfig);
  }
  const tauqeetMemAfter = process.memoryUsage().heapUsed;
  const tauqeetMemDeltaMb = ((tauqeetMemAfter - tauqeetMemBefore) / 1024 / 1024).toFixed(2);

  console.log(`[Adhan-JS]   Heap Delta After ${ITERATIONS} ops: ${adhanMemDeltaMb} MB`);
  console.log(`[Tauqeet-JS] Heap Delta After ${ITERATIONS} ops: ${tauqeetMemDeltaMb} MB`);
}

async function main() {
  try {
    await runDriftTest();
    await runThroughputTest();
    await runMemoryTest();
    console.log('\n[Benchmark Complete]');
  } catch (err) {
    console.error('Benchmark Failed:', err);
  }
}

main();
