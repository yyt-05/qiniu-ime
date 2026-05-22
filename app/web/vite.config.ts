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
      exclude: [
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/vite-env.d.ts',
        'next-env.d.ts',
        'vite.config.ts',
        'playwright.config.ts',
        'next.config.ts',
        'postcss.config.mjs',
        'tests/**',
        'dist/**',
        '.next/**'
      ],
      thresholds: {
        lines: 75,
        functions: 70,
        branches: 65,
        statements: 75
      }
    }
  }
});
