import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      ignoreDeprecations: '6.0' // Instructs TypeScript 6 to bypass the internal tsup baseUrl warning
    }
  },
  splitting: false,
  sourcemap: true,
  clean: true,
});
