import { describe, it, expect } from 'vitest';
import { formatTokens, formatTime, statusLabel } from './helpers';
import { isLlmConfigured } from './llmClient';

describe('helpers — formatTokens（预期通过）', () => {
  it('小于 1000 返回数字字符串', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(999)).toBe('999');
  });

  it('千级缩写为 k', () => {
    expect(formatTokens(1_500)).toBe('1.5k');
    expect(formatTokens(15_600)).toBe('15.6k');
  });

  it('百万级缩写为 M', () => {
    expect(formatTokens(2_200_000)).toBe('2.2M');
  });
});

describe('helpers — formatTime（预期通过）', () => {
  it('格式化为 HH:MM:SS', () => {
    const d = new Date('2026-03-28T08:09:05');
    expect(formatTime(d.getTime())).toBe('08:09:05');
  });
});

describe('helpers — statusLabel（预期通过）', () => {
  it('映射中文标签', () => {
    expect(statusLabel('running')).toBe('运行中');
    expect(statusLabel('idle')).toBe('空闲');
  });
});

describe('helpers — 故意失败的断言（用于演示 vitest 失败输出）', () => {
  it.skip('SKIP: 取消 .skip 可看到失败日志（错误期望值）', () => {
    expect(formatTokens(1500)).toBe('wrong');
  });
});

describe('isLlmConfigured（llmClient，预期通过）', () => {
  it('三项非空（含首尾空格 trim 后有效）为 true', () => {
    expect(
      isLlmConfigured({
        baseUrl: ' https://api.example ',
        apiKey: ' sk ',
        model: ' gpt-4 ',
      }),
    ).toBe(true);
  });

  it('缺 baseUrl 为 false', () => {
    expect(
      isLlmConfigured({
        baseUrl: '   ',
        apiKey: 'k',
        model: 'm',
      }),
    ).toBe(false);
  });
});
