import type { LlmSettings } from '@/types/llm';
import { useLlmActivityStore } from '@/store/useLlmActivityStore';
import { useConsoleStore } from '@/store/useConsoleStore';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface ChatCompletionOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  completionsPath: string;
  messages: ChatMessage[];
}

/** 单次请求超时（毫秒），避免界面长期无反馈 */
const REQUEST_TIMEOUT_MS = 120_000;

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return url.slice(0, 120);
  }
}

/**
 * OpenAI 兼容 POST .../chat/completions
 * 自动上报到 useLlmActivityStore（控制台「模型请求」可见）
 */
export async function chatCompletion(opts: ChatCompletionOptions): Promise<string> {
  const url = joinUrl(opts.baseUrl, opts.completionsPath || '/chat/completions');
  const urlDisplay = displayUrl(url);

  const ctrl = new AbortController();
  useLlmActivityStore.getState().begin(urlDisplay, opts.model, ctrl);
  useConsoleStore.getState().setActiveTab('llm');
  const t0 = performance.now();
  const timer = setTimeout(() => {
    useLlmActivityStore.setState({ abortCause: 'timeout' });
    ctrl.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
      }),
    });

    const raw = await res.text();
    const durationMs = performance.now() - t0;
    clearTimeout(timer);

    if (!res.ok) {
      const errText = raw || `HTTP ${res.status}`;
      useLlmActivityStore.getState().endFromFetch({
        durationMs,
        ok: false,
        httpStatus: res.status,
        error: errText.slice(0, 2000),
        urlDisplay,
        model: opts.model,
      });
      throw new Error(errText.slice(0, 500));
    }

    let data: unknown;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      useLlmActivityStore.getState().endFromFetch({
        durationMs,
        ok: false,
        error: '响应不是合法 JSON',
        urlDisplay,
        model: opts.model,
      });
      throw new Error('响应不是合法 JSON');
    }

    const obj = data as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (obj.error?.message) {
      useLlmActivityStore.getState().endFromFetch({
        durationMs,
        ok: false,
        httpStatus: res.status,
        error: obj.error.message,
        urlDisplay,
        model: opts.model,
      });
      throw new Error(obj.error.message);
    }

    const content = obj.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      useLlmActivityStore.getState().endFromFetch({
        durationMs,
        ok: false,
        httpStatus: res.status,
        error: '响应中无 choices[0].message.content',
        urlDisplay,
        model: opts.model,
      });
      throw new Error('响应中无 choices[0].message.content');
    }

    useLlmActivityStore.getState().endFromFetch({
      durationMs,
      ok: true,
      httpStatus: res.status,
      text: content,
      urlDisplay,
      model: opts.model,
    });

    return content;
  } catch (e) {
    clearTimeout(timer);
    const durationMs = performance.now() - t0;
    const abortCause = useLlmActivityStore.getState().abortCause;
    const msg =
      e instanceof Error && e.name === 'AbortError'
        ? abortCause === 'user'
          ? '已由用户中止请求'
          : `请求超时（>${REQUEST_TIMEOUT_MS / 1000}s）或网络中断`
        : e instanceof Error
          ? e.message
          : String(e);
    // 业务分支里已调用过 endFromFetch（如 HTTP 非 2xx、JSON 解析失败），避免 catch 再次覆盖 last（丢失 httpStatus 等）
    if (useLlmActivityStore.getState().status === 'loading') {
      useLlmActivityStore.getState().endFromFetch({
        durationMs,
        ok: false,
        error: msg,
        urlDisplay,
        model: opts.model,
      });
    }
    throw e instanceof Error ? e : new Error(msg);
  }
}

export function isLlmConfigured(s: Pick<LlmSettings, 'baseUrl' | 'apiKey' | 'model'>): boolean {
  return Boolean(s.baseUrl?.trim() && s.apiKey?.trim() && s.model?.trim());
}
