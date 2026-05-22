import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'vite.config.ts', 'playwright.config.ts', 'tests/**', 'dist/**'],
      thresholds: {
        lines: 75,
        functions: 70,
        branches: 65,
        statements: 75
      }
    }
  }
});
