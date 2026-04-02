import { useCallback } from 'react';
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

export function WorkflowCanvas() {
  const { nodes, edges, setNodes, setEdges, mode, tasks, activeTaskId, clearActiveTask } = useWorkflowStore();

  const reviewTask = tasks.find((t) => t.id === activeTaskId && t.status === 'reviewing');

  const onNodesChange = useCallback(
    (changes: NodeChange<AgentFlowNode>[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds) as AgentFlowNode[]),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        background: 'var(--surface-base)',
        overflow: 'hidden',
      }}
    >
      {mode === 'runtime' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,122,255,0.04) 0%, transparent 70%)',
          }}
        />
      )}

      {mode === 'design' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 70%)',
          }}
        />
      )}

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
        fitViewOptions={{ padding: 0.15 }}
        defaultEdgeOptions={{
          style: {
            stroke: 'rgba(255,255,255,0.15)',
            strokeWidth: 1.5,
          },
          animated: false,
        }}
        style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
        <Controls
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--surface-border)',
            borderRadius: '8px',
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const data = n.data as AgentFlowNode['data'];
            return statusColor(data?.status ?? 'idle');
          }}
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--surface-border)',
            borderRadius: '8px',
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>

      <div
        style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            padding: '5px 14px',
            borderRadius: 20,
            background: 'rgba(10,10,15,0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--surface-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              color: 'var(--text-accent)',
            }}
          >
            太和殿 · Workflow Canvas
          </span>
          <span
            style={{
              fontSize: 10,
              background: mode === 'design' ? 'rgba(0,122,255,0.2)' : 'rgba(201,168,76,0.2)',
              padding: '1px 6px',
              borderRadius: 4,
              color: mode === 'design' ? '#007AFF' : 'var(--text-accent)',
            }}
          >
            {mode === 'design' ? '设计模式' : '运行模式'}
          </span>
        </div>
      </div>

      <DispatchPanel />

      {reviewTask ? (
        <ReviewModal task={reviewTask} onClose={() => clearActiveTask()} />
      ) : null}
    </div>
  );
}
