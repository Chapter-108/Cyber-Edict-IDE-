import { create } from 'zustand';
import type { AgentNodeData, SOULConfig } from '../types/agent';
import { useWorkflowStore } from './useWorkflowStore';

interface InspectorState {
  isEditing: boolean;
  draftSoul: SOULConfig | null;
  openInspector: (_data: AgentNodeData) => void;
  startEditing: () => void;
  discardEdit: () => void;
  commitEdit: () => void;
  updateDraftSoul: (patch: Partial<SOULConfig>) => void;
}

export const useInspectorStore = create<InspectorState>((set, get) => ({
  isEditing: false,
  draftSoul: null,
  openInspector: () => set({ isEditing: false, draftSoul: null }),
  startEditing: () => {
    const id = useWorkflowStore.getState().selectedNodeId;
    if (!id) return;
    const n = useWorkflowStore.getState().nodes.find((x) => x.id === id);
    if (!n) return;
    set({ isEditing: true, draftSoul: structuredClone(n.data.soulConfig) });
  },
  discardEdit: () => set({ isEditing: false, draftSoul: null }),
  commitEdit: () => {
    const { isEditing, draftSoul } = get();
    if (!isEditing || !draftSoul) return;
    const wid = useWorkflowStore.getState().selectedNodeId;
    if (!wid) return;
    useWorkflowStore.getState().updateNodeSoul(wid, draftSoul);
    useWorkflowStore.getState().pushLog({
      level: 'info',
      agentId: wid,
      message: 'SOUL 配置已更新（Inspector）',
    });
    set({ isEditing: false, draftSoul: null });
  },
  updateDraftSoul: (patch) =>
    set((s) => ({
      draftSoul: s.draftSoul ? { ...s.draftSoul, ...patch } : null,
    })),
}));
