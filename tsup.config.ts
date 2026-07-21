import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/prayers/index.ts',            // tauqeet-js/prayers
    'src/qibla/index.ts',              // tauqeet-js/qibla
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
