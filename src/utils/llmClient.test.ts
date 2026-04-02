import { describe, it, expect, vi } from 'vitest';
import { chatCompletion } from './llmClient';
import { useLlmActivityStore } from '@/store/useLlmActivityStore';

const baseOpts = {
  baseUrl: 'https://api.example.com',
  apiKey: 'sk-test',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 100,
  completionsPath: '/v1/chat/completions',
  messages: [{ role: 'user' as const, content: 'hi' }],
};

function mockFetch(impl: () => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>) {
  vi.stubGlobal('fetch', vi.fn(impl) as unknown as typeof fetch);
}

describe('chatCompletion — 成功（HTTP 200 + 合法 JSON）', () => {
  it('返回 choices[0].message.content，activity 为 success', async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          choices: [{ message: { content: 'hello from mock' } }],
        }),
    }));

    const out = await chatCompletion(baseOpts);
    expect(out).toBe('hello from mock');

    const st = useLlmActivityStore.getState();
    expect(st.status).toBe('success');
    expect(st.last?.ok).toBe(true);
    expect(st.last?.httpStatus).toBe(200);
    expect(st.last?.snippet).toContain('hello from mock');
  });
});

describe('chatCompletion — 失败场景（应 reject，且 last 为 error）', () => {
  it('HTTP 401：记录 httpStatus 与错误正文', async () => {
    mockFetch(async () => ({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    }));

    await expect(chatCompletion(baseOpts)).rejects.toThrow();

    const st = useLlmActivityStore.getState();
    expect(st.status).toBe('error');
    expect(st.last?.ok).toBe(false);
    expect(st.last?.httpStatus).toBe(401);
    expect(st.last?.error).toContain('unauthorized');
  });

  it('HTTP 200 但正文不是 JSON', async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      text: async () => 'not json {{{',
    }));

    await expect(chatCompletion(baseOpts)).rejects.toThrow('响应不是合法 JSON');

    expect(useLlmActivityStore.getState().last?.ok).toBe(false);
    expect(useLlmActivityStore.getState().last?.error).toContain('合法 JSON');
  });

  it('JSON 含 OpenAI 风格 error.message', async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ error: { message: 'model_not_found' } }),
    }));

    await expect(chatCompletion(baseOpts)).rejects.toThrow('model_not_found');

    const st = useLlmActivityStore.getState();
    expect(st.last?.ok).toBe(false);
    expect(st.last?.error).toBe('model_not_found');
  });

  it('缺少 choices[0].message.content', async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ choices: [{}] }),
    }));

    await expect(chatCompletion(baseOpts)).rejects.toThrow('choices[0].message.content');
    expect(useLlmActivityStore.getState().last?.ok).toBe(false);
  });
});

describe('chatCompletion — 用户中止', () => {
  it('abortInFlightUser 后抛出 AbortError 且 last.error 含「用户中止」', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          const sig = init?.signal;
          if (!sig) {
            reject(new Error('no signal'));
            return;
          }
          const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
          if (sig.aborted) {
            onAbort();
            return;
          }
          sig.addEventListener('abort', onAbort, { once: true });
        });
      }) as unknown as typeof fetch,
    );

    const p = chatCompletion(baseOpts);
    await Promise.resolve();
    useLlmActivityStore.getState().abortInFlightUser();
    await expect(p).rejects.toThrow();

    const st = useLlmActivityStore.getState();
    expect(st.status).toBe('error');
    expect(st.last?.ok).toBe(false);
    expect(st.last?.error).toContain('用户中止');
  });
});

describe('chatCompletion — 运行中状态', () => {
  it('begin 后进入 loading，直至正文返回后 success', async () => {
    let resolveText!: (v: string) => void;
    const textPromise = new Promise<string>((resolve) => {
      resolveText = resolve;
    });

    mockFetch(async () => ({
      ok: true,
      status: 200,
      text: () => textPromise,
    }));

    const p = chatCompletion(baseOpts);
    expect(useLlmActivityStore.getState().status).toBe('loading');
    expect(useLlmActivityStore.getState().pendingUrl).toContain('api.example.com');

    await Promise.resolve();
    expect(useLlmActivityStore.getState().status).toBe('loading');

    resolveText(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }));
    await p;
    expect(useLlmActivityStore.getState().status).toBe('success');
  });
});
