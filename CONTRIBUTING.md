# Contributing to tauqeet-js

Thank you for your interest in contributing! This guide explains how to set up your development environment, run tests, and submit changes.

> For end-user documentation visit **[https://tauqeet-js.web.app](https://tauqeet-js.web.app)**.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Getting Started](#2-getting-started)
3. [Project Structure](#3-project-structure)
4. [Building](#4-building)
5. [Testing](#5-testing)
6. [Adding a New Calculation Method](#6-adding-a-new-calculation-method)
7. [Coding Standards](#7-coding-standards)
8. [Submitting Changes](#8-submitting-changes)
9. [License](#9-license)

---

## 1. Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| TypeScript | ≥ 5 (installed as a dev dependency) |

---

## 2. Getting Started

```bash
# Clone the repository
git clone https://github.com/h-ghulam-hasnain/tauqeet-js.git
cd tauqeet-js

# Install dependencies
npm install

# Start watch mode (rebuild on file change)
npm run dev
```

---

## 3. Project Structure

```
tauqeet-js/
├── src/
│   ├── index.ts               # Public entry point
│   ├── prayers/               # Prayer time engine
│   ├── qibla/                 # Qibla direction & distance
│   ├── moon/                  # Moon phase, age, events, visibility
│   ├── hijri/                 # Hijri calendar conversions
│   ├── solar-alignment/       # Sun-at-Qibla times
│   ├── astronomy/             # Private ephemeris engine (do not export)
│   └── internal/              # Private math & validation utilities
├── tests/                     # Automated test suites (Vitest)
│   ├── prayer/
│   ├── extended/
│   ├── engine.test.ts
│   ├── high-latitude.test.ts
│   └── moon.test.ts
├── manual_testing/            # Manual sanity-check scripts
├── dist/                      # Build output (git-ignored)
├── tsconfig.json
├── tsup.config.ts
└── vitest.config.ts
```

See [MODULES.md](MODULES.md) for an in-depth explanation of the dependency graph.

---

## 4. Building

```bash
# Single build
npm run build

# Watch mode (rebuilds on file change)
npm run dev
```

The build output lands in `dist/`:
- `dist/index.js` — ESM
- `dist/index.cjs` — CommonJS
- `dist/index.d.ts` — TypeScript declarations

The build is configured in `tsup.config.ts`.

---

## 5. Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npx vitest

# Run a specific test file
npx vitest tests/moon.test.ts
```

Tests are written with [Vitest](https://vitest.dev/) and live under `tests/`.

### Writing Tests

- Place new tests in the most appropriate sub-directory of `tests/`.
- Each test file should import from `../src/...` (not from `dist/`).
- Use `describe` blocks to group related tests and `it` blocks for individual assertions.
- Prefer data-driven tests for numerical precision (compare against known reference values).

```ts
import { describe, it, expect } from 'vitest';
import { calculatePrayerTimes } from '../src/prayers/index.js';

describe('Prayer Times – London', () => {
  it('Fajr should be before Sunrise', () => {
    const result = calculatePrayerTimes({
      lat: 51.5074,
      long: -0.1278,
      date: new Date('2024-04-09'),
      method: 'MWL',
    });

    expect(result.fajr.timestamp).not.toBeNull();
    expect(result.sunrise.timestamp).not.toBeNull();
    expect(result.fajr.timestamp!).toBeLessThan(result.sunrise.timestamp!);
  });
});
```

### Manual Testing

The `manual_testing/` directory contains standalone `.js` / `.mjs` scripts for quick sanity checks. These are not automated and require a built `dist/`:

```bash
npm run build
node manual_testing/prayer/karachi.js
```

---

## 6. Adding a New Calculation Method

Prayer-time calculation methods are defined in `src/prayers/config/methodRegistry.ts`. To add a new built-in method:

1. Open `src/prayers/config/methodRegistry.ts`.
2. Add a new entry to `BUILT_IN_METHODS`:

```ts
MyMethod: {
  id:         'MyMethod',
  name:       'My Institution Name',
  fajrAngle:  18,
  ishaAngle:  17,
  source:     'MI',
},
```

3. If the new method uses **minutes after Maghrib** instead of an Isha angle:

```ts
MyMethod: {
  id:         'MyMethod',
  name:       'My Institution Name',
  fajrAngle:  18.5,
  ishaAngle:  null,
  ishaMinutes: 90,   // 90 minutes after Maghrib
  source:     'MI',
},
```

4. Add a test in `tests/prayer/` verifying the new method against a known reference time.

---

## 7. Coding Standards

- **TypeScript strict mode** is enabled. All new code must compile without errors under `tsconfig.json`.
- Use **`readonly`** for all interface properties and function parameters where mutation is not intended.
- Use **named exports** only — no default exports anywhere in the library.
- Keep the `astronomy/` and `internal/` directories **private**. Do not re-export their symbols from `src/index.ts`.
- All public functions should have a JSDoc comment describing parameters, return value, and any exceptions.
- Follow the existing file naming conventions (PascalCase for classes, camelCase for functions/files).

---

## 8. Submitting Changes

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes, add tests, and ensure the build passes:
   ```bash
   npm run build && npm test
   ```

3. Commit with a clear, descriptive message:
   ```
   feat(moon): add getMoonIllumination export
   fix(prayers): handle polar night edge case in AngleBased strategy
   docs: update API reference for HijriEngine.getMonthGrid
   ```

4. Open a **Pull Request** against the `main` branch.

---

## 9. License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
