Here’s an **updated, comprehensive list** of validation commands that a maintainer should run before releasing a new version of TauqeetJS. These are specifically tailored to your current project structure and `package.json` scripts.

---

## Validation Commands

Run these commands in sequence to ensure the library is build‑ready, error‑free, performant, and secure.

### 1. Code Quality & Linting
```bash
# ESLint – catches syntax, style, and potential bugs in src/ and tests/
npm run lint

# Prettier – ensure all code follows the standard formatting
npm run format:check

# (Optional) Auto-fix linting and formatting issues
npm run lint:fix
npm run format
```

### 2. Type Checking
```bash
# Full type‑check without emitting files (fast)
npx tsc --noEmit

# Type‑check with diagnostics (shows performance per phase)
npx tsc --diagnostics
```

### 3. Build Verification
```bash
# Build the project into the dist/ directory using tsup
npm run build

# Run tsup in watch mode during active development
npm run dev
```

### 4. Unit & Integration Tests
```bash
# Run all tests using Vitest – must pass 100%
npm test

# Run only a specific test directory (e.g., Prayers or Astronomy)
npx vitest run tests/prayers
npx vitest run tests/astronomy
```

### 5. Bundle Size & Package Analysis
```bash
# Dry‑run pack – shows tarball content and total size
npm pack --dry-run

# Actually pack and inspect the .tgz contents (optional)
npm pack && tar -tzf tauqeet-js-*.tgz | sort
```

### 6. Dependency & Security Audit
```bash
# Check for known vulnerabilities in dependencies
npm audit

# List all installed dependencies (shows tree)
npm ls --depth=0

# Check for outdated packages
npm outdated
```

### 7. Memory & V8 Optimization Verification (Advanced)
```bash
# Run a quick script to ensure prayer times load into V8 cleanly without deopts
node --trace-deopt --trace-ic -e "import('./dist/index.js').then(m => m.getPrayerTimes({lat:21.4, long:39.8}))" 2>&1

# Check for memory leaks by tracing Garbage Collection
node --trace-gc -e "import('./dist/index.js').then(m => m.getPrayerTimes({lat:21.4, long:39.8}))" 2>&1 | grep -E "GC|Allocated"
```

### 8. Publishing & CI‑Ready Smoke Test
```bash
# Simulate npm publish (does not upload, verifies prepublishOnly hook)
npm publish --dry-run

# Quick import test (Node.js ESM)
node -e "import('./dist/index.js').then(m => console.log('✅ ESM import works'))"

# Quick CJS import test 
node -e "const m = require('./dist/index.cjs'); console.log('✅ CJS import works')"

# Run all core CI validations in one go
npm run lint && npm run build && npm test
```

---

**Pro Tip:** Your `package.json` already correctly implements the most important hook:
`"prepublishOnly": "npm run build && npm test"`

This ensures that you can never accidentally publish a broken version of TauqeetJS to NPM!
