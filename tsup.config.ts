import { defineConfig } from 'tsup';

/**
 * TauqeetJS Tsup Configuration — ESM + CJS, declaration maps, tree-shakable entries.
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/prayer/index.ts',
    'src/qibla/index.ts',
    'src/moon-visibility/index.ts',
    'src/astronomy/index.ts',
    'src/factory/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    compilerOptions: {
      declarationMap: true,
    },
  },
  clean: true,
  minify: true,
  treeshake: true,
  splitting: true,
  sourcemap: true,
  target: 'es2015',
  outDir: 'dist',
  bundle: true,
  skipNodeModulesBundle: true,
});
