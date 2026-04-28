import { defineConfig } from 'tsup';

/**
 * TauqeetJS Tsup Configuration
 * Optimized for high-performance distribution and tree-shaking.
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/prayer/index.ts',
    'src/qibla/index.ts',
    'src/moon/index.ts',
    'src/astronomy/index.ts',
    'src/ui/index.ts'
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
  treeshake: true,
  splitting: true,
  sourcemap: true,
  // target: 'es2015' ensures compatibility with older environments 
  // while maintaining ES module features.
  target: 'es2015',
  outDir: 'dist',
  // Ensure the UI module is properly bundled without bleeding into core
  bundle: true,
  // Babel integration note: For maximum compatibility (IE11/ES5), 
  // one would typically chain tsup with a babel step or use an esbuild-babel plugin.
  // Given the zero-dependency mandate, we prioritize esbuild's built-in transpilation.
});
