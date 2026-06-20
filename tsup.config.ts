import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',                    // tauqeet-js  (all modules)
    'src/prayers/index.ts',            // tauqeet-js/prayers
    'src/qibla/index.ts',              // tauqeet-js/qibla
    'src/moon/index.ts',               // tauqeet-js/moon
    'src/hijri/index.ts',              // tauqeet-js/hijri
    'src/solar-alignment/index.ts',    // tauqeet-js/solar-alignment
  ],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0', // Instructs TypeScript 6 to bypass the internal tsup baseUrl warning
    },
  },
  splitting: false,
  sourcemap: true,
  treeshake: true,
  minifySyntax: true,
  clean: true,
});

