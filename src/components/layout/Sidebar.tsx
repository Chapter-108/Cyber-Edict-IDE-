import type { CSSProperties } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useInspectorStore } from '@/store/useInspectorStore';
import { statusColor, statusLabel, ministryIcon, roleIcon, formatTokens } from '@/utils/helpers';
import type { AgentNodeData } from '@/types/agent';

export function Sidebar() {
  const { nodes, selectedNodeId, selectNode, mode } = useWorkflowStore();
  const { openInspector } = useInspectorStore();

  const pickAgent = (id: string, data: AgentNodeData) => {
    const next = selectedNodeId === id ? null : id;
    selectNode(next);
    if (next) openInspector(data);
  };

  const provinces = nodes.filter((n) => n.data.role !== 'Worker');
  const workers = nodes.filter((n) => n.data.role === 'Worker');

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        height: '100%',
        background: 'var(--surface-raised)',
        borderRight: '1px solid var(--surface-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid var(--surface-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
          }}
        >
          Agent Explorer
        </span>
        {mode === 'design' ? (
          <button
            type="button"
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              border: '1px solid var(--surface-border)',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="阶段 2：创建 Agent"
          >
            +
          </button>
        ) : null}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <SectionLabel label="三省 · Orchestrators" />
        {provinces.map((n) => (
          <AgentRow
            key={n.id}
            data={n.data}
            selected={selectedNodeId === n.id}
            onSelect={() => pickAgent(n.id, n.data)}
          />
        ))}

        <SectionLabel label="六部 · Workers" style={{ marginTop: 8 }} />
        {workers.map((n) => (
          <AgentRow
            key={n.id}
            data={n.data}
            selected={selectedNodeId === n.id}
            onSelect={() => pickAgent(n.id, n.data)}
          />
        ))}
      </div>

      <div
        style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--surface-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {nodes.length} agents · {nodes.filter((n) => n.data.status !== 'idle').length} active
        </span>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--status-running)',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}
        />
      </div>
    </aside>
  );
}

function SectionLabel({ label, style }: { label: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        padding: '4px 14px 4px',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {label}
    </div>
  );
}

function AgentRow({
  data,
  selected,
  onSelect,
}: {
  data: AgentNodeData;
  selected: boolean;
  onSelect: () => void;
}) {
  const icon = data.role === 'Worker' ? ministryIcon(data.ministry) : roleIcon(data.role);
  const color = statusColor(data.status);

  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        border: 'none',
        borderLeft: selected ? '2px solid var(--text-accent)' : '2px solid transparent',
        background: selected ? 'rgba(201,168,76,0.08)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          animation: data.status === 'running' ? 'pulse-dot 2s ease-in-out infinite' : 'none',
        }}
      />
      <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'var(--font-display)',
          }}
        >
          {data.label}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {statusLabel(data.status)}
        </div>
      </div>
      {data.tokenCount ? (
        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {formatTokens(data.tokenCount)}
        </span>
      ) : null}
    </button>
  );
}
