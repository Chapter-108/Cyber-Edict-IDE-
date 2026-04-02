import { create } from 'zustand';

export type LlmActivityStatus = 'idle' | 'loading' | 'success' | 'error';

export interface LlmLastCall {
  at: number;
  durationMs: number;
  method: string;
  urlDisplay: string;
  model: string;
  httpStatus?: number;
  ok: boolean;
  error?: string;
  responseChars?: number;
  snippet?: string;
}

interface LlmActivityState {
  status: LlmActivityStatus;
  phaseLabel: string;
  startedAt: number | null;
  pendingUrl: string | null;
  pendingModel: string | null;
  last: LlmLastCall | null;
  /** 当前进行中的 fetch 所用控制器；结束请求或完成后清空 */
  currentAbort: AbortController | null;
  /** 区分用户点击「结束」与定时器超时 */
  abortCause: null | 'user' | 'timeout';
  begin: (urlDisplay: string, model: string, abortCtrl: AbortController) => void;
  /** 用户主动中止当前模型 HTTP 请求 */
  abortInFlightUser: () => void;
  /** 清空「模型请求」面板的摘要卡片（不影响进行中的请求） */
  clearDisplay: () => void;
  endFromFetch: (p: {
    durationMs: number;
    ok: boolean;
    httpStatus?: number;
    error?: string;
    text?: string;
    urlDisplay: string;
    model: string;
  }) => void;
}

export const useLlmActivityStore = create<LlmActivityState>((set, get) => ({
  status: 'idle',
  phaseLabel: '',
  startedAt: null,
  pendingUrl: null,
  pendingModel: null,
  last: null,
  currentAbort: null,
  abortCause: null,

  begin: (urlDisplay, model, abortCtrl) =>
    set({
      status: 'loading',
      phaseLabel: '正在请求模型 API（可切到控制台「模型请求」查看）…',
      startedAt: Date.now(),
      pendingUrl: urlDisplay,
      pendingModel: model,
      currentAbort: abortCtrl,
      abortCause: null,
    }),

  abortInFlightUser: () => {
    const { status, currentAbort } = get();
    if (status !== 'loading' || !currentAbort) return;
    set({ abortCause: 'user' });
    currentAbort.abort();
  },

  clearDisplay: () => {
    if (get().status === 'loading') return;
    set({ status: 'idle', phaseLabel: '', last: null });
  },

  endFromFetch: ({ durationMs, ok, httpStatus, error, text, urlDisplay, model }) =>
    set({
      status: ok ? 'success' : 'error',
      phaseLabel: ok ? `已完成 · ${Math.round(durationMs)} ms` : `失败 · ${Math.round(durationMs)} ms`,
      startedAt: null,
      pendingUrl: null,
      pendingModel: null,
      currentAbort: null,
      abortCause: null,
      last: {
        at: Date.now(),
        durationMs,
        method: 'POST',
        urlDisplay,
        model,
        httpStatus,
        ok,
        error,
        responseChars: text ? text.length : undefined,
        snippet: text ? text.slice(0, 800) : undefined,
      },
    }),
}));
