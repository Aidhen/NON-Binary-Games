import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@nbg/shared': path.resolve(import.meta.dirname, '../shared/src/index.ts'),
    },
  }
});