// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      exclude: [
        '**/*.test.ts',
        '**/types.ts',
        '**/index.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/.next/**'
      ]
    }
  }
});