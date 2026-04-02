import { create } from 'zustand';
import type { Edge } from '@xyflow/react';
import type { AgentStatus, LogEntry, SOULConfig, WorkflowMode } from '../types/agent';
import type { WorkflowTask } from '../types/workflow';
import { initialEdges, initialNodes } from '../mocks/nineMinistries';
import { useLlmSettingsStore } from './useLlmSettingsStore';
import { chatCompletion, isLlmConfigured } from '../utils/llmClient';

// ── 超时配置 ────────────────────────────────────────────────────────────────
/** LLM 调用最长等待时间（ms）。超时后自动报错并继续流程，节点不会卡死。 */
const LLM_CALL_TIMEOUT_MS = 60_000;

/**
 * 给任意 Promise 加超时：超时后 reject，不影响原 Promise 继续运行（fetch 仍在网络层）。
 * 若需要同时终止网络请求，用 useLlmActivityStore.abortInFlightUser()。
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} 超时（${ms / 1000}s），已自动跳过`)),
        ms,
      ),
    ),
  ]);
}

// ── 日志序列号 ───────────────────────────────────────────────────────────────
let logSeq = 0;
function nextLogId() {
  logSeq += 1;
  return `log-${logSeq}`;
}

export type AgentFlowNode = import('../types/workflow').AgentFlowNode;

interface WorkflowState {
  mode: WorkflowMode;
  setMode: (m: WorkflowMode) => void;
  nodes: AgentFlowNode[];
  edges: Edge[];
  setNodes: (next: AgentFlowNode[] | ((prev: AgentFlowNode[]) => AgentFlowNode[])) => void;
  setEdges: (next: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  selectedNodeId: string | null;
  selectNode: (id: string | null) => void;
  logs: LogEntry[];
  clearLogs: () => void;
  pushLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  updateNodeSoul: (nodeId: string, soul: SOULConfig) => void;
  updateNodeStatus: (id: string, status: AgentStatus) => void;

  tasks: WorkflowTask[];
  activeTaskId: string | null;
  clearActiveTask: () => void;
  focusReviewTask: () => void;
  dispatchTask: (title: string, description: string) => Promise<void>;
  approveReview: (taskId: string) => void;
  rejectReview: (taskId: string, notes: string) => void;
  stopTask: (taskId: string) => void;

  /**
   * 紧急重置：将所有卡在 'running' 的节点强制回滚为 'idle'。
   * 用于网络异常/超时后画布节点依然显示运行中的兜底手段。
   */
  resetStuckNodes: () => void;
}

function seedLogs(): LogEntry[] {
  const welcome: LogEntry = {
    id: nextLogId(),
    timestamp: Date.now(),
    level: 'system',
    agentId: 'zhongshu',
    message: 'Cyber-Edict IDE 已就绪 · 太和殿画布加载完成',
  };
  const fromAgents = initialNodes.flatMap((n) => n.data.logs);
  return [welcome, ...fromAgents].slice(0, 80);
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  mode: 'design',
  setMode: (m) =>
    set((s) => ({
      mode: m,
      nodes: s.nodes.map((n) => ({
        ...n,
        data: { ...n.data, mode: m },
      })),
    })),
  nodes: initialNodes,
  edges: initialEdges,
  setNodes: (updater) =>
    set((s) => ({
      nodes: typeof updater === 'function' ? updater(s.nodes) : updater,
    })),
  setEdges: (updater) =>
    set((s) => ({
      edges: typeof updater === 'function' ? updater(s.edges) : updater,
    })),
  selectedNodeId: null,
  selectNode: (id) => set({ selectedNodeId: id }),
  logs: seedLogs(),
  clearLogs: () => set({ logs: [] }),
  pushLog: (log) =>
    set((s) => ({
      logs: [...s.logs, { ...log, id: nextLogId(), timestamp: Date.now() }],
    })),
  updateNodeSoul: (nodeId, soul) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, soulConfig: soul, lastActive: Date.now() } }
          : n,
      ),
    })),
  updateNodeStatus: (id, status) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, status, lastActive: Date.now() } } : n,
      ),
    })),

  tasks: [],
  activeTaskId: null,
  clearActiveTask: () => set({ activeTaskId: null }),

  focusReviewTask: () => {
    const t = get().tasks.find((x) => x.status === 'reviewing');
    if (t) set({ activeTaskId: t.id });
  },

  // ── resetStuckNodes ────────────────────────────────────────────────────────
  resetStuckNodes: () => {
    const stuck = get().nodes.filter((n) => n.data.status === 'running');
    if (stuck.length === 0) return;
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.data.status === 'running'
          ? { ...n, data: { ...n.data, status: 'idle', lastActive: Date.now() } }
          : n,
      ),
    }));
    get().pushLog({
      level: 'warn',
      agentId: 'system',
      message: `已强制重置 ${stuck.length} 个卡死节点（${stuck.map((n) => n.data.label).join('、')}）→ idle`,
    });
  },

  // ── dispatchTask ───────────────────────────────────────────────────────────
  dispatchTask: async (title, description) => {
    const taskId = `t-${Date.now()}`;
    const task: WorkflowTask = {
      id: taskId,
      title,
      description,
      status: 'reviewing',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({ tasks: [task, ...s.tasks], activeTaskId: taskId }));

    const llm = useLlmSettingsStore.getState();
    const runModel = llm.autoInvokeOnDispatch && isLlmConfigured(llm);

    if (!runModel) {
      const hint = !isLlmConfigured(llm)
        ? 'API（Base URL / Key / Model）未配齐，本次不发起网络请求。'
        : '未勾选「下旨后自动调用模型」，本次不发起网络请求。';
      get().pushLog({
        level: 'system',
        agentId: 'zhongshu',
        message: `中书省：已接旨「${title}」。${hint}正在送门下省审议。`,
        taskId,
      });
    }

    // ── 调用模型（含超时保护） ───────────────────────────────────────────────
    if (runModel) {
      get().updateNodeStatus('zhongshu', 'running');
      get().pushLog({
        level: 'system',
        agentId: 'zhongshu',
        message: `中书省：正在调用模型生成规划摘要…（最长等待 ${LLM_CALL_TIMEOUT_MS / 1000}s）`,
        taskId,
      });

      try {
        const zh = get().nodes.find((n) => n.id === 'zhongshu');
        const sc = zh?.data.soulConfig;
        const system = [
          `你是${sc?.role ?? '中书省规划官'}。`,
          sc?.persona ?? '',
          '根据用户旨意输出简洁、分条的中书规划要点（不超过 800 字）。',
        ]
          .filter(Boolean)
          .join('\n');

        // ↓ 关键：用 withTimeout 包裹，超过 60s 自动报错，节点不再卡死
        const text = await withTimeout(
          chatCompletion({
            baseUrl: llm.baseUrl.trim(),
            apiKey: llm.apiKey,
            model: llm.model.trim(),
            temperature: llm.temperature,
            maxTokens: Math.min(llm.maxTokens, 4096),
            completionsPath: llm.completionsPath,
            messages: [
              { role: 'system', content: system },
              {
                role: 'user',
                content: `旨意标题：${title}\n\n详细说明：\n${description || '（无）'}`,
              },
            ],
          }),
          LLM_CALL_TIMEOUT_MS,
          '中书省模型调用',
        );

        const clip = text.length > 900 ? `${text.slice(0, 900)}…` : text;
        get().pushLog({
          level: 'info',
          agentId: 'zhongshu',
          message: `模型规划摘要：\n${clip}`,
          taskId,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        get().pushLog({
          level: 'error',
          agentId: 'zhongshu',
          message: `模型调用失败：${msg}`,
          taskId,
        });
        // 失败后仍然继续流程（进入门下省审议），不卡死
      }
    }

    // ── 无论模型成功/失败/超时，都推进到门下省 ──────────────────────────────
    get().updateNodeStatus('zhongshu', 'completed');
    get().updateNodeStatus('menxia', 'reviewing');
    get().pushLog({
      level: 'system',
      agentId: 'zhongshu',
      message: runModel
        ? `中书省：已完成「${title}」规划，送门下省审议`
        : `中书省：旨意「${title}」已登记，门下省审议弹窗已打开。`,
      taskId,
    });
  },

  approveReview: (taskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'dispatched', updatedAt: Date.now() } : t,
      ),
      activeTaskId: null,
    }));
    get().updateNodeStatus('menxia', 'completed');
    get().updateNodeStatus('shangshu', 'running');
    get().pushLog({
      level: 'system',
      agentId: 'menxia',
      message: '门下省：准奏，移交尚书省分发六部',
      taskId,
    });
  },

  rejectReview: (taskId, notes) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'rejected', reviewNotes: notes, updatedAt: Date.now() } : t,
      ),
      activeTaskId: null,
    }));
    get().updateNodeStatus('menxia', 'rejected');
    get().updateNodeStatus('zhongshu', 'running');
    get().pushLog({
      level: 'warn',
      agentId: 'menxia',
      message: `门下省封驳：${notes}`,
      taskId,
    });
  },

  stopTask: (taskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'blocked', updatedAt: Date.now() } : t,
      ),
      activeTaskId: null,
    }));
    get().updateNodeStatus('menxia', 'blocked');
    get().pushLog({
      level: 'warn',
      agentId: 'menxia',
      message: '旨意已终止，未移交尚书省',
      taskId,
    });
  },
}));
