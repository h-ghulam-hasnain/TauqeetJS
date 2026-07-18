import { performance } from 'perf_hooks';

async function main() {
  if (!global.gc) {
    console.warn('If you\'re in main directory, run this command Node --expose-gc scripts/benchmark-365-batch.mjs');
    return;
  }

  const lat   = 31.5204;
  const lng   = 74.3587;
  const START = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
  const DAYS  = 365;

  const adhan = await import('adhan');
  const { calculatePrayerTimes } = await import('../dist/prayers/index.js');

  const adhanCoords = new adhan.Coordinates(lat, lng);
  const adhanParams = adhan.CalculationMethod.MuslimWorldLeague();
  const tauqeetCfg  = { lat, long: lng, method: 'MWL', timeZone: 'UTC' };

  // ── Warmup (10 iterations — below JIT hotness threshold) ─────────────────
  for (let i = 0; i < 10; i++) {
    const d = new Date(START.getTime() + i * 86400000);
    new adhan.PrayerTimes(adhanCoords, d, adhanParams);
    calculatePrayerTimes({ ...tauqeetCfg, date: d });
  }

  // ── Per-day latency capture ───────────────────────────────────────────────
  const adhanLatencies   = new Float64Array(DAYS);
  const tauqeetLatencies = new Float64Array(DAYS);

  global.gc();
  const memBeforeAdhan = process.memoryUsage().heapUsed;
  const t0Adhan = process.hrtime.bigint();

  for (let i = 0; i < DAYS; i++) {
    const d = new Date(START.getTime() + i * 86400000);
    const s = process.hrtime.bigint();
    new adhan.PrayerTimes(adhanCoords, d, adhanParams);
    adhanLatencies[i] = Number(process.hrtime.bigint() - s);
  }

  const adhanTotalNs = Number(process.hrtime.bigint() - t0Adhan);
  global.gc();
  const memAfterAdhan = process.memoryUsage().heapUsed;

  global.gc();
  const memBeforeTauqeet = process.memoryUsage().heapUsed;
  const t0Tauqeet = process.hrtime.bigint();

  for (let i = 0; i < DAYS; i++) {
    const d = new Date(START.getTime() + i * 86400000);
    const s = process.hrtime.bigint();
    calculatePrayerTimes({ ...tauqeetCfg, date: d });
    tauqeetLatencies[i] = Number(process.hrtime.bigint() - s);
  }

  const tauqeetTotalNs = Number(process.hrtime.bigint() - t0Tauqeet);
  global.gc();
  const memAfterTauqeet = process.memoryUsage().heapUsed;

  // ── Statistics ────────────────────────────────────────────────────────────
  function stats(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mean   = arr.reduce((s, v) => s + v, 0) / arr.length;
    const p50    = sorted[Math.floor(sorted.length * 0.50)];
    const p95    = sorted[Math.floor(sorted.length * 0.95)];
    const p99    = sorted[Math.floor(sorted.length * 0.99)];
    const min    = sorted[0];
    const max    = sorted[sorted.length - 1];
    return { mean, p50, p95, p99, min, max };
  }

  const adhanStats   = stats(adhanLatencies);
  const tauqeetStats = stats(tauqeetLatencies);

  console.log('\n=== 365-DAY BATCH (Lahore 31.5204°N, 74.3587°E) ===\n');

  console.log('[Adhan-JS]');
  console.log(`  Total Time   : ${(adhanTotalNs / 1e6).toFixed(2)} ms`);
  console.log(`  Throughput   : ${(DAYS / (adhanTotalNs / 1e9)).toFixed(1)} ops/sec`);
  console.log(`  Mean Latency : ${(adhanStats.mean / 1e3).toFixed(2)} µs`);
  console.log(`  P50          : ${(adhanStats.p50 / 1e3).toFixed(2)} µs`);
  console.log(`  P95          : ${(adhanStats.p95 / 1e3).toFixed(2)} µs`);
  console.log(`  P99          : ${(adhanStats.p99 / 1e3).toFixed(2)} µs`);
  console.log(`  Min          : ${(adhanStats.min / 1e3).toFixed(2)} µs`);
  console.log(`  Max          : ${(adhanStats.max / 1e3).toFixed(2)} µs`);
  console.log(`  Heap Delta   : ${((memAfterAdhan - memBeforeAdhan) / 1024).toFixed(2)} KB`);

  console.log('\n[Tauqeet-JS]');
  console.log(`  Total Time   : ${(tauqeetTotalNs / 1e6).toFixed(2)} ms`);
  console.log(`  Throughput   : ${(DAYS / (tauqeetTotalNs / 1e9)).toFixed(1)} ops/sec`);
  console.log(`  Mean Latency : ${(tauqeetStats.mean / 1e3).toFixed(2)} µs`);
  console.log(`  P50          : ${(tauqeetStats.p50 / 1e3).toFixed(2)} µs`);
  console.log(`  P95          : ${(tauqeetStats.p95 / 1e3).toFixed(2)} µs`);
  console.log(`  P99          : ${(tauqeetStats.p99 / 1e3).toFixed(2)} µs`);
  console.log(`  Min          : ${(tauqeetStats.min / 1e3).toFixed(2)} µs`);
  console.log(`  Max          : ${(tauqeetStats.max / 1e3).toFixed(2)} µs`);
  console.log(`  Heap Delta   : ${((memAfterTauqeet - memBeforeTauqeet) / 1024).toFixed(2)} KB`);

  console.log(`\n  Ratio (total): adhan is ${(tauqeetTotalNs / adhanTotalNs).toFixed(2)}x faster`);
  console.log(`  Ratio (mean) : adhan is ${(tauqeetStats.mean / adhanStats.mean).toFixed(2)}x faster per-day`);

  // ── JIT tier progression: first-10 vs last-10 per-day latencies ──────────
  console.log('\n--- JIT TIER PROGRESSION ---');
  console.log('Adhan  first 10 (ns):', Array.from(adhanLatencies.slice(0, 10)).map(v => Math.round(v)).join(', '));
  console.log('Adhan  last  10 (ns):', Array.from(adhanLatencies.slice(355)).map(v => Math.round(v)).join(', '));
  console.log('Tauqeet first 10 (ns):', Array.from(tauqeetLatencies.slice(0, 10)).map(v => Math.round(v)).join(', '));
  console.log('Tauqeet last  10 (ns):', Array.from(tauqeetLatencies.slice(355)).map(v => Math.round(v)).join(', '));
}

main().catch(console.error);
