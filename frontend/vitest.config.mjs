import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const configDir = import.meta.dirname;

export default defineConfig({
  root: configDir,

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(configDir, './src'),
      '@nbg/shared': path.resolve(
        configDir,
        '../shared/src/index.ts'
      ),
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(configDir, './vitest.setup.ts')],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
