import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0' // Instructs TypeScript 6 to bypass the internal tsup baseUrl warning
    }
  },
  splitting: false,
  sourcemap: true,
  treeshake: true,
  minifySyntax: true,
  clean: true,
});
