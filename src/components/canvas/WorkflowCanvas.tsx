import { useCallback, useMemo, type CSSProperties } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore, type AgentFlowNode } from '@/store/useWorkflowStore';
import { AgentNode } from '@/components/nodes/AgentNode';
import { statusColor } from '@/utils/helpers';
import { DispatchPanel } from '@/components/canvas/DispatchPanel';
import { ReviewModal } from '@/components/canvas/ReviewModal';

const nodeTypes = { agentNode: AgentNode };

// ── Static styles ──────────────────────────────────────────────────────────
const wrapperStyle: CSSProperties = {
  flex: 1,
  position: 'relative',
  background: 'var(--surface-base)',
  overflow: 'hidden',
};

const runtimeGlowStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  pointerEvents: 'none',
  background: 'radial-gradient(ellipse at 50% 0%, rgba(0,122,255,0.04) 0%, transparent 70%)',
};

const designGlowStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  pointerEvents: 'none',
  background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 70%)',
};

const controlsStyle: CSSProperties = {
  background: 'var(--surface-raised)',
  border: '1px solid var(--surface-border)',
  borderRadius: '8px',
};

const miniMapStyle: CSSProperties = {
  background: 'var(--surface-raised)',
  border: '1px solid var(--surface-border)',
  borderRadius: '8px',
};

const chipWrapStyle: CSSProperties = {
  position: 'absolute',
  top: 14,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 10,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const chipStyle: CSSProperties = {
  padding: '5px 14px',
  borderRadius: 20,
  background: 'rgba(10,10,15,0.75)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--surface-border)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const chipTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 12,
  color: 'var(--text-accent)',
};

const defaultEdgeStyle: CSSProperties = {
  stroke: 'rgba(255,255,255,0.15)',
  strokeWidth: 1.5,
};

const defaultEdgeOptions = { style: defaultEdgeStyle, animated: false };
const fitViewOptions = { padding: 0.15 };
const flowBg: CSSProperties = { background: 'transparent' };

export function WorkflowCanvas() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const setNodes = useWorkflowStore((s) => s.setNodes);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const mode = useWorkflowStore((s) => s.mode);
  const tasks = useWorkflowStore((s) => s.tasks);
  const activeTaskId = useWorkflowStore((s) => s.activeTaskId);
  const clearActiveTask = useWorkflowStore((s) => s.clearActiveTask);

  const reviewTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId && t.status === 'reviewing'),
    [tasks, activeTaskId],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<AgentFlowNode>[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds) as AgentFlowNode[]),
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const modeBadgeStyle = useMemo<CSSProperties>(
    () => ({
      fontSize: 10,
      background: mode === 'design' ? 'rgba(0,122,255,0.2)' : 'rgba(201,168,76,0.2)',
      padding: '1px 6px',
      borderRadius: 4,
      color: mode === 'design' ? '#007AFF' : 'var(--text-accent)',
    }),
    [mode],
  );

  return (
    <div style={wrapperStyle}>
      {mode === 'runtime' && <div style={runtimeGlowStyle} />}
      {mode === 'design' && <div style={designGlowStyle} />}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={mode === 'design'}
        nodesConnectable={mode === 'design'}
        elementsSelectable
        fitView
        fitViewOptions={fitViewOptions}
        defaultEdgeOptions={defaultEdgeOptions}
        style={flowBg}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
        <Controls style={controlsStyle} />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as AgentFlowNode['data'];
            return statusColor(data?.status ?? 'idle');
          }}
          style={miniMapStyle}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>

      <div style={chipWrapStyle}>
        <div style={chipStyle}>
          <span style={chipTitleStyle}>太和殿 · Workflow Canvas</span>
          <span style={modeBadgeStyle}>{mode === 'design' ? '设计模式' : '运行模式'}</span>
        </div>
      </div>

      <DispatchPanel />

      {reviewTask ? <ReviewModal task={reviewTask} onClose={() => clearActiveTask()} /> : null}
    </div>
  );
}
