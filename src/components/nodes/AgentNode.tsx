import { memo, useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { AgentFlowData } from '@/types/agent';
import {
  statusColor,
  statusBg,
  statusLabel,
  ministryIcon,
  roleIcon,
  formatTokens,
  ministryColor,
  roleColor,
} from '@/utils/helpers';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useInspectorStore } from '@/store/useInspectorStore';

type AgentFlowNode = Node<AgentFlowData, 'agentNode'>;

export const AgentNode = memo(({ data, selected }: NodeProps<AgentFlowNode>) => {
  const { selectNode, mode } = useWorkflowStore();
  const { openInspector } = useInspectorStore();
  const [hovered, setHovered] = useState(false);

  const isProvince = data.role !== 'Worker';
  const icon = data.role === 'Worker' ? ministryIcon(data.ministry) : roleIcon(data.role);
  const accentColor = data.role === 'Worker' ? ministryColor(data.ministry) : roleColor(data.role);

  const handleClick = () => {
    selectNode(data.id);
    openInspector(data);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: isProvince ? 180 : 140,
        background: 'var(--surface-raised)',
        border: `1px solid ${
          selected ? accentColor : hovered ? 'var(--surface-border-strong)' : 'var(--surface-border)'
        }`,
        borderRadius: isProvince ? 12 : 10,
        boxShadow: selected
          ? `0 0 0 2px ${accentColor}40, 0 8px 32px rgba(0,0,0,0.4)`
          : hovered
            ? '0 4px 16px rgba(0,0,0,0.3)'
            : '0 2px 8px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        overflow: 'hidden',
        transform: selected ? 'translateY(-1px)' : 'none',
      }}
    >
      <div
        style={{
          height: 3,
          background: accentColor,
          opacity: data.status === 'idle' ? 0.3 : 1,
          transition: 'opacity 0.2s',
        }}
      />

      <div style={{ padding: isProvince ? '12px 14px' : '10px 12px', position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: isProvince ? 20 : 16 }}>{icon}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: statusColor(data.status),
                flexShrink: 0,
                animation:
                  data.status === 'running'
                    ? 'pulse-dot 1.5s ease-in-out infinite'
                    : data.status === 'reviewing'
                      ? 'pulse-dot 2.5s ease-in-out infinite'
                      : 'none',
              }}
            />
          </div>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: isProvince ? 14 : 12,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 4,
            lineHeight: 1.2,
          }}
        >
          {data.label}
        </div>

        <div
          style={{
            fontSize: 10,
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.soulConfig.model}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 7px',
            borderRadius: 20,
            background: statusBg(data.status),
            border: `1px solid ${statusColor(data.status)}35`,
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 500, color: statusColor(data.status) }}>
            {statusLabel(data.status)}
          </span>
        </div>

        {(hovered || selected) && data.tokenCount ? (
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid var(--surface-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              animation: 'fadeIn 0.15s ease',
            }}
          >
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>tokens</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>
              {formatTokens(data.tokenCount)}
            </span>
          </div>
        ) : null}

        {mode === 'design' ? (
          <div
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 6,
              height: 6,
              borderRadius: 2,
              background: '#007AFF40',
              border: '1px solid #007AFF60',
            }}
          />
        ) : null}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: accentColor,
          width: 8,
          height: 8,
          border: `2px solid var(--surface-raised)`,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: accentColor,
          width: 8,
          height: 8,
          border: `2px solid var(--surface-raised)`,
        }}
      />
    </div>
  );
});

AgentNode.displayName = 'AgentNode';
