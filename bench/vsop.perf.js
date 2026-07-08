import { seriesSum } from '../dist/astronomy/theories/vsop87/vsop87.js';
import { L0 } from '../dist/astronomy/theories/vsop87/vsop87Coefficients.js';

const L0_A = L0.A;
const L0_B = L0.B;
const L0_C = L0.C;

const ITERATIONS = 50000;
const tau = 0.5;

// Warm-up (JIT compilation)
for (let i = 0; i < 1000; i++) seriesSum(tau, L0_A, L0_B, L0_C);

// Measure
const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  seriesSum(tau, L0_A, L0_B, L0_C);
}
const end = performance.now();

const avgMs = (end - start) / ITERATIONS;
console.log(`\u2705 ${ITERATIONS.toLocaleString()} calls in ${(end - start).toFixed(2)}ms`);
console.log(`\ud83d\udcca Avg: ${avgMs.toFixed(4)}ms per call`);
console.log(`\ud83d\ude80 Throughput: ${(ITERATIONS / ((end - start) / 1000)).toFixed(0)} ops/sec`);
