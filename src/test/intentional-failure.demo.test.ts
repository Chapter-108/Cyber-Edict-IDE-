/**
 * 故意失败：用于查看 vitest 失败日志与退出码 ≠ 0。
 * 默认 `npm test` 不会包含本文件（见 vite.config.ts exclude）。
 * 运行：npm run test:fail-demo
 */
import { describe, it, expect } from 'vitest';

describe('演示：必然失败', () => {
  it('错误期望值（预期本条失败）', () => {
    expect(1).toBe(2);
  });
});
