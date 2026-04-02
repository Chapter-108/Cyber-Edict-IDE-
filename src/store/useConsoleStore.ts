import { create } from 'zustand';

/** 预留：三省流转 / 六部并行 / 系统事件 分栏（ROADMAP §7） */
export type ConsoleTab = 'flow' | 'parallel' | 'system' | 'llm';

interface ConsoleState {
  activeTab: ConsoleTab;
  setActiveTab: (t: ConsoleTab) => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  activeTab: 'flow',
  setActiveTab: (t) => set({ activeTab: t }),
}));
