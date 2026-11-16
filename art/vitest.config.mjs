import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const configDir = import.meta.dirname;

export default defineConfig({
  root: configDir,

  plugins: [react()],

  test: {
    environment: 'jsdom',
    globals: true,
    // The same setup as the frontend: the drawings are React components and are tested like its own.
    setupFiles: [path.resolve(configDir, '../frontend/vitest.setup.ts')],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
