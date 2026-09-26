import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 15000, 
    setupFiles: ['./vitest.setup.ts'],
  },
});