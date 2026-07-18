import { performance } from 'perf_hooks';
import v8 from 'v8';

async function main() {
    if (!global.gc) {
        console.warn('WARNING: Script must be run with --expose-gc to collect accurate heap statistics.');
        return;
    }

    const date = new Date(Date.UTC(2026, 6, 9, 12, 0, 0));
    const lat = 31.5204;
    const lng = 74.3587;

    console.log('--- 1. INITIALIZATION & COLD START ---');
    global.gc();
    const memBeforeAdhanLoad = process.memoryUsage().heapUsed;
    const startAdhanLoad = performance.now();
    const adhan = await import('adhan');
    const endAdhanLoad = performance.now();
    global.gc();
    const memAfterAdhanLoad = process.memoryUsage().heapUsed;
    console.log(`Adhan Module Import Time: ${(endAdhanLoad - startAdhanLoad).toFixed(3)} ms`);
    console.log(`Adhan Module Heap Overhead: ${((memAfterAdhanLoad - memBeforeAdhanLoad)/1024).toFixed(2)} KB`);

    global.gc();
    const memBeforeTauqeetLoad = process.memoryUsage().heapUsed;
    const startTauqeetLoad = performance.now();
    const { calculatePrayerTimes } = await import('../dist/prayers/index.js');
    const endTauqeetLoad = performance.now();
    global.gc();
    const memAfterTauqeetLoad = process.memoryUsage().heapUsed;
    console.log(`Tauqeet Module Import Time: ${(endTauqeetLoad - startTauqeetLoad).toFixed(3)} ms`);
    console.log(`Tauqeet Module Heap Overhead: ${((memAfterTauqeetLoad - memBeforeTauqeetLoad)/1024).toFixed(2)} KB`);

    // Warmup & Cache/VSOP load
    console.log('\n--- 2. COLD EXECUTION (INCLUDING JIT & ASSET INFLATION) ---');
    const adhanCoords = new adhan.Coordinates(lat, lng);
    const adhanParams = adhan.CalculationMethod.MuslimWorldLeague();
    
    global.gc();
    const adhanColdStart = process.hrtime.bigint();
    new adhan.PrayerTimes(adhanCoords, date, adhanParams);
    const adhanColdEnd = process.hrtime.bigint();
    global.gc();
    console.log(`Adhan First-Run (Cold): ${Number(adhanColdEnd - adhanColdStart)} ns`);

    const tauqeetConfig = { lat, long: lng, date, method: 'MWL', timeZone: 'UTC' };
    
    global.gc();
    const tauqeetColdMemBefore = process.memoryUsage().heapUsed;
    const tauqeetColdStart = process.hrtime.bigint();
    calculatePrayerTimes(tauqeetConfig); // This triggers VSOP87 inflate
    const tauqeetColdEnd = process.hrtime.bigint();
    global.gc();
    const tauqeetColdMemAfter = process.memoryUsage().heapUsed;
    console.log(`Tauqeet First-Run (Cold, inflates arrays): ${Number(tauqeetColdEnd - tauqeetColdStart)} ns`);
    console.log(`Tauqeet Array Inflate Heap Bloat: ${((tauqeetColdMemAfter - tauqeetColdMemBefore)/1024).toFixed(2)} KB`);

    console.log('\n--- 3. SINGLE-RUN RUNTIME SPEED & LATENCY (WARM) ---');
    
    global.gc();
    const startAdhanRun = process.hrtime.bigint();
    new adhan.PrayerTimes(adhanCoords, date, adhanParams);
    const endAdhanRun = process.hrtime.bigint();
    console.log(`Adhan Single-Run Latency: ${Number(endAdhanRun - startAdhanRun)} ns`);

    global.gc();
    const startTauqeetRun = process.hrtime.bigint();
    calculatePrayerTimes(tauqeetConfig);
    const endTauqeetRun = process.hrtime.bigint();
    console.log(`Tauqeet Single-Run Latency: ${Number(endTauqeetRun - startTauqeetRun)} ns`);

    console.log('\n--- 4. TOTAL MEMORY FOOTPRINT (HEAP ALLOCATION PER RUN) ---');
    
    global.gc();
    let mem1 = process.memoryUsage().heapUsed;
    new adhan.PrayerTimes(adhanCoords, date, adhanParams);
    let mem2 = process.memoryUsage().heapUsed;
    console.log(`Adhan Single-Run Heap Delta: ${mem2 - mem1} bytes`);

    global.gc();
    let mem3 = process.memoryUsage().heapUsed;
    calculatePrayerTimes(tauqeetConfig);
    let mem4 = process.memoryUsage().heapUsed;
    console.log(`Tauqeet Single-Run Heap Delta: ${mem4 - mem3} bytes`);
}

main().catch(console.error);
