import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use relative path for shared
    include: ['**/*.{test,spec}.ts', '../shared/**/*.{test,spec}.ts'],
    globals: true,
    environment: 'node',
  },
});