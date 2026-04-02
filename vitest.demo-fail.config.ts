import { defineConfig } from 'vitest/config';
import path from 'node:path';

/** 仅运行「必然失败」演示用例，不加载主套件的 setup */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/test/intentional-failure.demo.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: [],
  },
});
