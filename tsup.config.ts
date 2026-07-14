import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',                    // tauqeet-js  (all modules)
    'src/prayers/index.ts',            // tauqeet-js/prayers
    'src/qibla/index.ts',              // tauqeet-js/qibla
    'src/moon/index.ts',               // tauqeet-js/moon
    'src/astronomy/index.ts',          // tauqeet-js/astronomy
  ],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0', // Instructs TypeScript 6 to bypass the internal tsup baseUrl warning
    },
  },
  splitting: false,
  sourcemap: false,
  treeshake: true,
  minify: true,
  minifySyntax: true,
  clean: true,
});
