You have a solid library – now it's time to make it **production‑ready**. Based on your goals (dual‑module, tree‑shaking, zero runtime deps, monorepo, etc.), here is a comprehensive checklist of improvements you should ensure.

---

## 1. Dual‑Module Output (ESM + CJS)

Your library must support both **ECMAScript Modules** (for modern bundlers) and **CommonJS** (for Node.js). This enables tree‑shaking and better compatibility.

### Configuration in `tsup.config.ts` (or similar)

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],        // both output formats
  dts: true,                     // generate .d.ts files
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  splitting: false,              // keep single file for simpler import
  minify: false,                 // for library, minify is optional
  esbuildOptions(options) {
    options.target = 'es2020';   // modern baseline
  }
});
```

### `package.json` fields

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./prayers": {
      "import": "./dist/prayers/index.js",
      "require": "./dist/prayers/index.cjs",
      "types": "./dist/prayers/index.d.ts"
    },
    "./qibla": { ... },
    "./moon": { ... },
    "./hijri": { ... }
  },
  "sideEffects": false
}
```

This allows users to import only what they need, e.g. `import { getPrayerTimes } from 'tauqeet-js/prayers'` – greatly reducing bundle size.

---

## 2. Defensive `tsconfig.json` Isolation

Ensure your TypeScript configuration is strict and prevents unwanted dependencies.

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "isolatedModules": true,          // ensures each file can be transpiled independently
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "target": "ES2020",
    "lib": ["ES2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- `isolatedModules: true` is critical for `tsup`/`esbuild` – they transpile each file independently without type information.
- Use `"type": "module"` in `package.json` if you ship ESM only, but with dual format it's better to omit it and let the `exports` field handle it.

---

## 3. API Surface Control & Tree Shaking

- **Barrel exports** (`src/index.ts`) should only re‑export public APIs. Avoid re‑exporting internal helpers.
- **Sub‑path exports** as shown above – each module (`prayers`, `qibla`, etc.) should have its own entry point.
- Set `"sideEffects": false` in `package.json` to allow bundlers to eliminate unused exports.
- Use **named exports** exclusively – avoid default exports to prevent bundler confusion.
- Use **`export * from`** sparingly; prefer explicit re‑exports for clarity.

```ts
// src/prayers/index.ts
export { getPrayerTimes, calculatePrayerTimes } from './core';
export type { PrayerTimesResult, PrayerMethod, ... } from './types';
```

---

## 4. Zero Production Dependencies

Your library should **not** install any runtime dependencies. All calculations are pure math – no need for `lodash`, `moment`, or other helpers.

- Move all dev tools (`typescript`, `vitest`, `tsup`, `eslint`, etc.) to `devDependencies`.
- If you need utility functions, **inline them** (e.g., a small `clamp`, `toRadians`) rather than importing a package.
- Use the built‑in `Math` object and standard `Date` – no external helpers.

**Why?** This keeps your library lightweight, avoids version conflicts, and ensures it works in any JavaScript environment (Node, browser, React Native).

---

## 5. Monorepo Organization (Optional but Recommended)

If you plan to split your library into multiple independent packages (e.g., `@tauqeet/prayers`, `@tauqeet/qibla`, etc.), use a monorepo with **pnpm workspaces** or **npm workspaces**.

**Benefits:**
- Independent versioning.
- Users can install only what they need.
- Faster build times (each package built separately).

**Structure:**
```
packages/
  prayers/
    src/
    package.json (name: "@tauqeet/prayers")
  qibla/
  moon/
  hijri/
  core/          (shared astronomy utils)
```

But for now, you can keep a single package with **sub‑path exports** – that’s simpler and achieves similar tree‑shaking.

---

## 6. Robust Configuration & Runtime Type Safety

Your library accepts many options (prayer method, madhab, high‑latitude rule, etc.). Use **Zod** (or `io-ts`) to validate input objects at runtime – but since you want zero deps, you can do manual validation or use a lightweight schema library that you bundle (Zod adds ~13kB). It’s often worth it for user‑friendliness.

Example:

```ts
import { z } from 'zod';

const PrayerOptionsSchema = z.object({
  lat: z.number().min(-90).max(90),
  long: z.number().min(-180).max(180),
  method: z.enum(['MWL','ISNA','UmmAlQura',...]),
  // ...
});
```

If you don’t want Zod, implement a simple `validateOptions` function that checks types and ranges and throws descriptive errors.

**Also:** Use **enums** (or union types) for all configurable options – this gives TypeScript autocompletion and catches mistakes at compile time.

---

## 7. Performance Optimizations

Your library already computes ephemeris accurately. To make it **faster**:

- **Memoize expensive calculations** – e.g., solar declination and equation of time for a given date. Use a simple cache (Map) keyed by date string or Julian day.
- **Avoid repeated `Date` object creation** – pass timestamps or Julian days internally.
- **Batch calculations** – if generating a full month’s prayer times, compute solar position once per day and reuse across prayers.
- **Use `Intl.DateTimeFormat` only for formatting** – not for core logic.

Example memoization:

```ts
const declinationCache = new Map<number, number>();
function getSolarDeclination(jd: number): number {
  if (!declinationCache.has(jd)) {
    declinationCache.set(jd, computeDeclination(jd));
  }
  return declinationCache.get(jd)!;
}
```

---

## 8. Bundle Size & Tree Shaking Verification

Use tools like **`bundlejs.com`** or **`size-limit`** to check your library’s size.

```bash
npx size-limit
```

Add a `size-limit` config in `package.json`:

```json
{
  "size-limit": [
    {
      "path": "dist/index.js",
      "limit": "10 KB"
    }
  ]
}
```

Ensure that after tree‑shaking, a simple import of one function results in a small footprint.

---

## 9. Testing Strategy

- **Unit tests** for every public function – use `vitest` or `jest`.
- **Snapshot tests** for formatted outputs? Not necessary.
- **Property‑based testing** (optional) – use `fast-check` to test invariants (e.g., `toHijri(toGregorian(h)) === h`).
- **Integration tests** – compare against known datasets (e.g., USNO, ICOP) for prayer times, moon phases, etc.
- **Performance benchmarks** – ensure calculations complete within <1ms.

---

## 10. Documentation & Developer Experience

- Generate API docs with **TypeDoc**.
- Write a comprehensive `README.md` with examples for each module.
- Provide a **CHANGELOG.md**.
- Add **JSDoc** comments to all public functions – this powers IntelliSense in IDEs.

---

## 11. CI/CD & Publishing

- Use **GitHub Actions** (or similar) to run tests and lint on every push.
- Use **semantic-release** or **changesets** for automated versioning and publishing to npm.
- Ensure you have `prepublishOnly` script that runs `npm run build` before publishing.

---

## 12. Code Quality

- **ESLint** with `@typescript-eslint` rules.
- **Prettier** for consistent formatting.
- **Husky** + **lint-staged** to enforce formatting/type checks on commit.

---

## Summary Checklist

| Area | Action |
|------|--------|
| **Output** | Dual ESM/CJS via tsup, correct `package.json` exports |
| **TypeScript** | `isolatedModules`, strict mode, no unused locals |
| **Tree Shaking** | `sideEffects: false`, sub‑path exports, named exports |
| **Dependencies** | Zero runtime deps; all dev dependencies |
| **Monorepo** | Optional – use workspaces if splitting packages |
| **Config validation** | Use Zod (or manual) to validate inputs |
| **Performance** | Memoize celestial calculations, batch per day |
| **Testing** | Unit + integration + benchmark tests |
| **Docs** | JSDoc, README, TypeDoc |
| **CI/CD** | GitHub Actions, semantic-release, linting |

---
