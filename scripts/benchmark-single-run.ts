import { performance } from 'perf_hooks';

async function main() {
    if (!global.gc) {
        console.warn('WARNING: Script must be run with --expose-gc to collect accurate heap statistics.');
        return;
    }

    console.log('--- 1. INITIALIZATION & COLD START ---');
    global.gc();
    const memBeforeAdhan = process.memoryUsage().heapUsed;
    const startAdhanLoad = performance.now();
    const adhan = await import('adhan');
    const endAdhanLoad = performance.now();
    global.gc();
    const memAfterAdhan = process.memoryUsage().heapUsed;
    console.log(`Adhan Load Time: ${(endAdhanLoad - startAdhanLoad).toFixed(3)} ms`);
    console.log(`Adhan Heap Overhead: ${((memAfterAdhan - memBeforeAdhan)/1024).toFixed(2)} KB`);

    global.gc();
    const memBeforeTauqeet = process.memoryUsage().heapUsed;
    const startTauqeetLoad = performance.now();
    const { calculatePrayerTimes } = await import('../src/prayers/index.js');
    const { getVSOP87Tables } = await import('../src/astronomy/loader.js');
    await getVSOP87Tables(); // Wait for base64 decode and float64array inflation
    const endTauqeetLoad = performance.now();
    global.gc();
    const memAfterTauqeet = process.memoryUsage().heapUsed;
    console.log(`Tauqeet Load Time: ${(endTauqeetLoad - startTauqeetLoad).toFixed(3)} ms`);
    console.log(`Tauqeet Heap Overhead: ${((memAfterTauqeet - memBeforeTauqeet)/1024).toFixed(2)} KB`);

    console.log('\n--- 2. SINGLE-RUN RUNTIME SPEED & LATENCY ---');
    const date = new Date(Date.UTC(2026, 6, 9, 12, 0, 0)); // A specific date for consistency
    const lat = 31.5204;
    const lng = 74.3587;

    // Adhan-js
    const adhanCoords = new adhan.Coordinates(lat, lng);
    const adhanParams = adhan.CalculationMethod.MuslimWorldLeague();
    
    const startAdhanRun = process.hrtime.bigint();
    const adhanTimes = new adhan.PrayerTimes(adhanCoords, date, adhanParams);
    const endAdhanRun = process.hrtime.bigint();
    console.log(`Adhan Single-Run Latency: ${Number(endAdhanRun - startAdhanRun)} ns`);

    // Tauqeet-js
    const tauqeetConfig = { lat, long: lng, date, method: 'MWL' as const, timeZone: 'UTC' };
    const startTauqeetRun = process.hrtime.bigint();
    const tauqeetTimes = calculatePrayerTimes(tauqeetConfig);
    const endTauqeetRun = process.hrtime.bigint();
    console.log(`Tauqeet Single-Run Latency: ${Number(endTauqeetRun - startTauqeetRun)} ns`);

    console.log('\n--- 4. TOTAL MEMORY FOOTPRINT (HEAP ALLOCATION) ---');
    
    // Test Adhan Memory Single Run
    global.gc();
    const adhanMemBefore = process.memoryUsage().heapUsed;
    new adhan.PrayerTimes(adhanCoords, date, adhanParams);
    const adhanMemAfter = process.memoryUsage().heapUsed;
    console.log(`Adhan Single-Run Heap Delta: ${adhanMemAfter - adhanMemBefore} bytes`);

    // Test Tauqeet Memory Single Run
    global.gc();
    const tauqeetMemBefore = process.memoryUsage().heapUsed;
    calculatePrayerTimes(tauqeetConfig);
    const tauqeetMemAfter = process.memoryUsage().heapUsed;
    console.log(`Tauqeet Single-Run Heap Delta: ${tauqeetMemAfter - tauqeetMemBefore} bytes`);
}

main().catch(console.error);
