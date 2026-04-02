import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_LLM_SETTINGS, type LlmSettings } from '@/types/llm';

type LlmSettingsState = LlmSettings & {
  setSettings: (patch: Partial<LlmSettings>) => void;
  resetToDefaults: () => void;
};

export const useLlmSettingsStore = create<LlmSettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_LLM_SETTINGS,
      setSettings: (patch) => set((s) => ({ ...s, ...patch })),
      resetToDefaults: () => set({ ...DEFAULT_LLM_SETTINGS }),
    }),
    {
      name: 'cyber-edict-llm-settings-v1',
      partialize: (s) => ({
        baseUrl: s.baseUrl,
        apiKey: s.apiKey,
        model: s.model,
        temperature: s.temperature,
        maxTokens: s.maxTokens,
        completionsPath: s.completionsPath,
        autoInvokeOnDispatch: s.autoInvokeOnDispatch,
      }),
    }
  )
);
