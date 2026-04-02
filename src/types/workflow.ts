import type { AgentFlowData } from './agent';
import type { Edge, Node } from '@xyflow/react';

export type AgentFlowNode = Node<AgentFlowData, 'agentNode'>;
export type AgentFlowEdge = Edge;

/** 旨意 / 任务在三省六部流水线中的状态（对齐 ROADMAP 阶段 3） */
export type TaskStatus =
  | 'inbox'
  | 'planning'
  | 'reviewing'
  | 'dispatched'
  | 'executing'
  | 'pending_review'
  | 'completed'
  | 'rejected'
  | 'blocked';

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  assignedTo?: string[];
  reviewNotes?: string;
  parentTaskId?: string;
  subTaskIds?: string[];
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  label?: string;
  type?: 'default' | 'smoothstep' | 'step';
}

export interface WorkflowConfig {
  version: string;
  name: string;
  nodes: Array<{ id: string; position: { x: number; y: number }; data: import('./agent').AgentNodeData }>;
  edges: WorkflowEdge[];
  tasks: WorkflowTask[];
  exportedAt: number;
}
