import { defineConfig } from 'vitest/config';
import path from 'node:path';

const configDir = import.meta.dirname;

export default defineConfig({
  root: configDir,

  // The drawings are plain React components: the JSX transform of Vite is enough, with no plugin to install in this workspace.
  oxc: { jsx: { runtime: 'automatic' } },

  test: {
    environment: 'jsdom',
    globals: true,
    // The same setup as the frontend: the drawings are tested like its own components.
    setupFiles: [path.resolve(configDir, '../frontend/vitest.setup.ts')],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
});
