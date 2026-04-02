import { afterEach, beforeEach, vi } from 'vitest';
import { useLlmActivityStore } from '@/store/useLlmActivityStore';
import { useConsoleStore } from '@/store/useConsoleStore';

/** 每个用例前重置 LLM 活动 store，避免相互污染 */
beforeEach(() => {
  useConsoleStore.setState({ activeTab: 'flow' });
  useLlmActivityStore.setState({
    status: 'idle',
    phaseLabel: '',
    startedAt: null,
    pendingUrl: null,
    pendingModel: null,
    last: null,
    currentAbort: null,
    abortCause: null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
