import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

function findCandidate(root, rel) {
  const p = path.resolve(root, rel);
  return fs.existsSync(p) ? p : null;
}

async function run() {
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const projectRoot = path.resolve(scriptDir, '..');

  const candidates = [
    'dist/astronomy/theories/vsop87/vsop87Coefficients.js',
    'src/astronomy/theories/vsop87/vsop87Coefficients.js',
    'src/astronomy/theories/vsop87/vsop87Coefficients.ts'
  ];

  let found = null;
  for (const c of candidates) {
    const p = findCandidate(projectRoot, c);
    if (p) { found = p; break; }
  }

  if (!found) {
    console.error('No coefficients candidate found. Searched:\n', candidates.join('\n'));
    process.exit(2);
  }

  console.log('Profiling import of:', found);

  const report = (label) => {
    const m = process.memoryUsage();
    return {
      label,
      heapUsedMB: (m.heapUsed / 1024 / 1024).toFixed(2),
      rssMB: (m.rss / 1024 / 1024).toFixed(2),
    };
  };

  if (typeof globalThis.gc === 'function') {
    console.log('Forcing GC before import');
    globalThis.gc();
  } else {
    console.log('GC not exposed. Run with `--expose-gc` to enable forced GC.');
  }

  console.log('Memory before:', report('before'));
  const t0 = performance.now();

  // import via file:// URL to avoid loader resolution ambiguity
  const fileUrl = pathToFileURL(found).href;
  await import(fileUrl);

  const t1 = performance.now();
  console.log('Import wall time (ms):', (t1 - t0).toFixed(3));

  if (typeof globalThis.gc === 'function') globalThis.gc();
  console.log('Memory after:', report('after'));

  // Show detailed heap usage
  console.log('Detailed memory:', process.memoryUsage());
}

run().catch((e) => {
  console.error('Profile script error:', e);
  process.exit(1);
});
