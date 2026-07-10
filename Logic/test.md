Here’s an **expanded, comprehensive list** of validation commands that a maintainer should run before releasing v1.2.0 (or any version). I’ve added explanations so you know exactly what each command checks.

---

## 10. Validation Commands

Run these commands in sequence to ensure the library is build‑ready, error‑free, performant, and secure.

### 1. Code Quality & Linting
```bash
# ESLint – catches syntax, style, and potential bugs
npm run lint

# If you have a dedicated format check (Prettier)
npm run format:check
```

### 2. Type Checking
```bash
# Full type‑check without emitting files (fast)
npx tsc --noEmit

# Type‑check with diagnostics (shows performance per phase)
npx tsc --diagnostics

# Incremental type‑check (uses .tsbuildinfo cache)
npx tsc --noEmit --incremental

# Check only the source (exclude tests) – useful for CI
npx tsc --project tsconfig.build.json --noEmit
```

### 3. Build Verification
```bash
# Clean build (removes dist/ first)
npm run clean && npm run build

# Build with source maps enabled (for debugging)
npm run build:dev

# Build in production mode (minified, no maps)
npm run build:prod
```

### 4. Unit & Integration Tests
```bash
# Run all tests (Vitest) – must pass 100%
npm test

# Run tests with coverage report
npm run test:coverage

# Run only specific test files (e.g., Eclipse, which may be slow)
npx vitest run eclipse.test.ts

# Run tests with increased timeout for heavy computations
npx vitest run --testTimeout=15000 eclipse.test.ts
```

### 5. Performance Benchmarks
```bash
# Run the 365‑day benchmark (requires built dist)
node --expose-gc bench/365day.bench.js

# Run the VSOP87 seriesSum micro‑benchmark
node --expose-gc bench/vsop.perf.js

# Run with V8's internal tracing to detect deoptimizations
node --trace-deopt --trace-ic bench/vsop.perf.js 2>&1 | grep -E "deoptimizing|aborted"
```

### 6. Bundle Size & Package Analysis
```bash
# Dry‑run pack – shows tarball content and total size
npm pack --dry-run

# Actually pack and inspect the .tgz contents (optional)
npm pack && tar -tzf tauqeet-js-*.tgz | sort

# Check bundle size with a tool like `size-limit` (if configured)
npx size-limit

# Analyse the built bundle with `source-map-explorer`
npx source-map-explorer dist/index.cjs
```

### 7. Dependency & Security Audit
```bash
# Check for known vulnerabilities in dependencies
npm audit

# List all installed dependencies (shows tree)
npm ls --depth=0

# Check for outdated packages (optional)
npm outdated
```

### 8. Memory & Heap Analysis
```bash
# Run a small sample with heap profiling enabled
node --heap-prof -e "import('./dist/index.js').then(m => m.getPrayerTimes({lat:21.4, long:39.8}))"

# Run with GC exposed and record heap snapshots
node --expose-gc --heap-prof --heap-prof-dir=./prof bench/365day.bench.js

# Check for memory leaks using `node --trace-gc`
node --trace-gc bench/365day.bench.js 2>&1 | grep -E "GC|Allocated"
```

### 9. Runtime V8 Optimization Verification
```bash
# Confirm TurboFan compiles hot functions without deopts
node --trace-deopt --trace-ic -e "import('./dist/index.js').then(m => m.getPrayerTimes({lat:21.4, long:39.8}))" 2>&1

# Also check for hidden class transitions (megamorphic risks)
node --trace-maps -e "import('./dist/index.js').then(m => m.getPrayerTimes({lat:21.4, long:39.8}))"
```

### 10. TypeScript Declaration File Validation
```bash
# Ensure .d.ts files are emitted correctly (no missing types)
npx tsc --emitDeclarationOnly --declaration --declarationMap

# Check that the types are resolvable by a downstream consumer
npx tsc --project test/types/consumer.ts --noEmit
```

### 11. Publishing Dry‑Run
```bash
# Simulate npm publish (does not upload)
npm publish --dry-run

# Check if the package will contain the intended files
npm pack --dry-run --json | jq '.files[].path'
```

### 12. CI‑Ready Smoke Test
```bash
# Quick import test (Node.js ESM)
node -e "import('./dist/index.js').then(m => console.log('✅ ESM import works'))"

# Quick CJS import test (if you support both)
node -e "const m = require('./dist/index.cjs'); console.log('✅ CJS import works')"

# Run all validations in one go (for CI)
npm run lint && npm run build && npm test && npm audit
```

---

**Pro Tip:** Save these commands in your `package.json` scripts for easy reuse:

```json
{
  "scripts": {
    "validate": "npm run lint && npm run build && npm test",
    "validate:perf": "node --expose-gc bench/365day.bench.js",
    "validate:security": "npm audit && npm ls --depth=0",
    "validate:pack": "npm pack --dry-run",
    "validate:types": "npx tsc --noEmit"
  }
}
```

Then run `npm run validate` before every release to catch issues early.
