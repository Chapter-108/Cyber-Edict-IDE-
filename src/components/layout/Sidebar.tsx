import { memo, useCallback, useMemo, type CSSProperties } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useInspectorStore } from '@/store/useInspectorStore';
import { statusColor, statusLabel, ministryIcon, roleIcon, formatTokens } from '@/utils/helpers';
import type { AgentNodeData } from '@/types/agent';

// ── Static styles ──────────────────────────────────────────────────────────
const asideStyle: CSSProperties = {
  width: 'var(--sidebar-w)',
  height: '100%',
  background: 'var(--surface-raised)',
  borderRight: '1px solid var(--surface-border)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flexShrink: 0,
};

const headerStyle: CSSProperties = {
  padding: '12px 14px 10px',
  borderBottom: '1px solid var(--surface-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const headerLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
};

const addBtnStyle: CSSProperties = {
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
};

const listStyle: CSSProperties = { flex: 1, overflowY: 'auto', padding: '8px 0' };

const footerStyle: CSSProperties = {
  padding: '10px 14px',
  borderTop: '1px solid var(--surface-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const footerCountStyle: CSSProperties = { fontSize: 11, color: 'var(--text-tertiary)' };

const pulseDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--status-running)',
  animation: 'pulse-dot 2s ease-in-out infinite',
};

const sectionLabelBaseStyle: CSSProperties = {
  padding: '4px 14px 4px',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
};

const agentRowBaseStyle: CSSProperties = {
  width: '100%',
  padding: '7px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.12s ease',
  textAlign: 'left',
};

const agentIconStyle: CSSProperties = { fontSize: 13, flexShrink: 0 };
const agentInfoStyle: CSSProperties = { flex: 1, minWidth: 0 };
const agentNameStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: 'var(--font-display)',
};
const agentStatusStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
};
const agentTokenStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
  flexShrink: 0,
};

// ── Components ─────────────────────────────────────────────────────────────
export function Sidebar() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const mode = useWorkflowStore((s) => s.mode);
  const openInspector = useInspectorStore((s) => s.openInspector);

  const pickAgent = useCallback(
    (id: string, data: AgentNodeData) => {
      const next = selectedNodeId === id ? null : id;
      selectNode(next);
      if (next) openInspector(data);
    },
    [selectedNodeId, selectNode, openInspector],
  );

  const provinces = useMemo(() => nodes.filter((n) => n.data.role !== 'Worker'), [nodes]);
  const workers = useMemo(() => nodes.filter((n) => n.data.role === 'Worker'), [nodes]);

  const activeCount = useMemo(() => nodes.filter((n) => n.data.status !== 'idle').length, [nodes]);

  return (
    <aside style={asideStyle}>
      <div style={headerStyle}>
        <span style={headerLabelStyle}>Agent Explorer</span>
        {mode === 'design' ? (
          <button type="button" style={addBtnStyle} title="阶段 2：创建 Agent">
            +
          </button>
        ) : null}
      </div>

      <div style={listStyle}>
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

      <div style={footerStyle}>
        <span style={footerCountStyle}>
          {nodes.length} agents · {activeCount} active
        </span>
        <div style={pulseDotStyle} />
      </div>
    </aside>
  );
}

const SectionLabel = memo(function SectionLabel({
  label,
  style,
}: {
  label: string;
  style?: CSSProperties;
}) {
  const merged = useMemo(
    () => (style ? { ...sectionLabelBaseStyle, ...style } : sectionLabelBaseStyle),
    [style],
  );
  return <div style={merged}>{label}</div>;
});

const AgentRow = memo(function AgentRow({
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

  const rowStyle = useMemo<CSSProperties>(
    () => ({
      ...agentRowBaseStyle,
      borderLeft: selected ? '2px solid var(--text-accent)' : '2px solid transparent',
      background: selected ? 'rgba(201,168,76,0.08)' : 'transparent',
    }),
    [selected],
  );

  const dotStyle = useMemo<CSSProperties>(
    () => ({
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      animation: data.status === 'running' ? 'pulse-dot 2s ease-in-out infinite' : 'none',
    }),
    [color, data.status],
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      style={rowStyle}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      <div style={dotStyle} />
      <span style={agentIconStyle}>{icon}</span>
      <div style={agentInfoStyle}>
        <div style={agentNameStyle}>{data.label}</div>
        <div style={agentStatusStyle}>{statusLabel(data.status)}</div>
      </div>
      {data.tokenCount ? <span style={agentTokenStyle}>{formatTokens(data.tokenCount)}</span> : null}
    </button>
  );
});
