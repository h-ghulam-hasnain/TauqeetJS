import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/unit/**/*.test.ts',
      'tests/astronomy/solar-position.test.ts',
      'tests/astronomy/lunar-position.test.ts',
      'tests/prayer/**/*.test.ts',
    ],
  },
});
