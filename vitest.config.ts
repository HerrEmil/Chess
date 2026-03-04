import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    setupFiles: ['src/chess/__tests__/setup.ts'],
    environment: 'jsdom',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
});
