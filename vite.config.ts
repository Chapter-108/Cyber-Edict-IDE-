import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  /** 相对路径：打包为 Electron 时用 loadFile 打开 dist 时资源可正确加载 */
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/intentional-failure.demo.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    reporters: process.env.CI ? ['default', 'github-actions'] : ['verbose', 'default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/utils/**/*.ts', 'src/store/**/*.ts'],
      exclude: ['**/*.test.ts', '**/test/**'],
    },
  },
});
