/**
 * SOUL.md ↔ SOULConfig（阶段 4 可接 Monaco + 完整 YAML）
 */
import type { SOULConfig } from '../types/agent';

export function soulConfigToMarkdown(config: SOULConfig): string {
  const lines = [
    `# ${config.role}`,
    '',
    '## Persona',
    config.persona,
    '',
    '## Model',
    `- model: ${config.model}`,
    `- temperature: ${config.temperature}`,
    `- max_tokens: ${config.maxTokens}`,
    '',
    '## Skills',
    ...config.skills.map((s) => `- ${s}`),
    '',
    '## Rules',
    ...config.rules.map((r, i) => `${i + 1}. ${r}`),
    '',
    '## Output',
    config.outputFormat,
  ];
  return lines.join('\n');
}

export function defaultSoul(roleTitle: string): SOULConfig {
  return {
    role: roleTitle,
    persona: '依三省六部制履职，输出简洁、可执行。',
    skills: ['reasoning'],
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4096,
    rules: ['不得越权直联六部（Worker 除外）', '门下省未准奏不得派发'],
    outputFormat: 'markdown',
  };
}
