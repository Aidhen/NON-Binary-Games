import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      './shared/vitest.config.ts',
      './frontend/vitest.config.mjs',
      './backend/vitest.config.ts',
    ],

    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'clover', 'json', 'lcov'],

      include: [
        'shared/src/**/*.{ts,tsx}',
        'backend/src/**/*.{ts,tsx}',
        'frontend/src/**/*.{ts,tsx}',
      ],

      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'shared/src/index.ts',
        'shared/src/games/sudoku/index.ts',
        'shared/src/games/sudoku/types.ts',
        '**/layout.tsx',
      ],
    },
  },
});
