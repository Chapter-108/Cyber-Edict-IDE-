/**
 * 阶段 0 契约 · 见 ROADMAP.md §3
 * 变更请同步 CONTRACTS.md（后续可补）
 */

export type WorkflowMode = 'design' | 'runtime';

export type AgentRole = 'Zhongshu' | 'Menxia' | 'Shangshu' | 'Worker';

export type Ministry = 'Bing' | 'Hu' | 'Li' | 'Li_personnel' | 'Xing' | 'Gong';

export type AgentStatus =
  | 'idle'
  | 'running'
  | 'reviewing'
  | 'completed'
  | 'rejected'
  | 'blocked';

export interface SOULConfig {
  role: string;
  persona: string;
  skills: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  rules: string[];
  outputFormat: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'system';
  agentId: string;
  message: string;
  taskId?: string;
}

export interface AgentNodeData {
  id: string;
  label: string;
  role: AgentRole;
  ministry?: Ministry;
  status: AgentStatus;
  mode: WorkflowMode;
  soulConfig: SOULConfig;
  logs: LogEntry[];
  tokenCount?: number;
  lastActive?: number;
}

/** @xyflow/react：node.data 需满足 Record<string, unknown> */
export type AgentFlowData = AgentNodeData & Record<string, unknown>;
