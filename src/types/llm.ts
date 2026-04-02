/**
 * 自定义 OpenAI 兼容接口配置（本地存储，勿提交密钥到仓库）
 */
export interface LlmSettings {
  /** API 根路径，如 https://api.openai.com/v1 或自建网关 */
  baseUrl: string;
  /** Bearer Token，仅存浏览器 localStorage */
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  /** 接在 baseUrl 后的路径，默认 /chat/completions */
  completionsPath: string;
  /** 运行模式下「下旨」后是否自动调用模型生成中书规划摘要 */
  autoInvokeOnDispatch: boolean;
}

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 2048,
  completionsPath: '/chat/completions',
  autoInvokeOnDispatch: false,
};
