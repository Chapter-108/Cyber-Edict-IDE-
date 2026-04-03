import { memo, useState, useEffect, useMemo, type CSSProperties } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useConsoleStore } from '@/store/useConsoleStore';
import { useLlmActivityStore } from '@/store/useLlmActivityStore';
import { formatTime } from '@/utils/helpers';
import type { LogEntry } from '@/types/agent';

// ── Static styles ──────────────────────────────────────────────────────────
const toolbarStyle: CSSProperties = {
  height: 36,
  display: 'flex',
  alignItems: 'center',
  padding: '0 14px',
  gap: 10,
  flexShrink: 0,
};

const collapseBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-tertiary)',
  fontSize: 12,
  padding: 0,
};

const titleStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
};

const filterAreaStyle: CSSProperties = {
  display: 'flex',
  gap: 4,
  flex: 1,
  overflowX: 'auto',
  alignItems: 'center',
  minWidth: 0,
};

const countStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
};

const clearBtnStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-tertiary)',
  fontSize: 11,
  padding: 0,
};

const logAreaStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '4px 0',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
};

const emptyLogStyle: CSSProperties = {
  padding: 16,
  color: 'var(--text-tertiary)',
  textAlign: 'center',
};

const llmHintStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--text-tertiary)',
  lineHeight: 1.4,
  paddingRight: 8,
};

const logRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  padding: '3px 14px',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
};

const logTimeStyle: CSSProperties = {
  color: 'var(--text-tertiary)',
  flexShrink: 0,
  fontSize: 10,
};

const logAgentStyle: CSSProperties = {
  color: 'var(--text-accent)',
  flexShrink: 0,
  fontSize: 10,
};

const logTaskStyle: CSSProperties = {
  color: 'var(--text-tertiary)',
  flexShrink: 0,
  fontSize: 10,
};

// ── Tabs config (static) ───────────────────────────────────────────────────
const tabs = [
  { id: 'flow' as const, label: '三省' },
  { id: 'parallel' as const, label: '六部' },
  { id: 'system' as const, label: '系统' },
  { id: 'llm' as const, label: '模型请求' },
];

const levelColor: Record<string, string> = {
  info: 'var(--text-secondary)',
  warn: 'var(--status-reviewing)',
  error: 'var(--status-rejected)',
  system: 'var(--status-running)',
};

// ── Components ─────────────────────────────────────────────────────────────
export function Console() {
  const logs = useWorkflowStore((s) => s.logs);
  const clearLogs = useWorkflowStore((s) => s.clearLogs);
  const nodes = useWorkflowStore((s) => s.nodes);
  const activeTab = useConsoleStore((s) => s.activeTab);
  const setActiveTab = useConsoleStore((s) => s.setActiveTab);
  const [filter, setFilter] = useState<string>('all');
  const [collapsed, setCollapsed] = useState(false);

  const agentIds = useMemo(
    () => ['all', ...Array.from(new Set(logs.map((l) => l.agentId)))],
    [logs],
  );
  const filtered = useMemo(
    () => (filter === 'all' ? logs : logs.filter((l) => l.agentId === filter)),
    [logs, filter],
  );

  const agentLabel = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    return n?.data.label ?? id;
  };

  const containerStyle = useMemo<CSSProperties>(
    () => ({
      height: collapsed ? 36 : 'var(--console-h)',
      borderTop: '1px solid var(--surface-border)',
      background: 'var(--surface-overlay)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'height 0.2s ease',
      overflow: 'hidden',
    }),
    [collapsed],
  );

  const toolbarBorderStyle = useMemo<CSSProperties>(
    () => ({
      ...toolbarStyle,
      borderBottom: collapsed ? 'none' : '1px solid var(--surface-border)',
    }),
    [collapsed],
  );

  return (
    <div style={containerStyle}>
      <div style={toolbarBorderStyle}>
        <button type="button" onClick={() => setCollapsed((c) => !c)} style={collapseBtnStyle}>
          {collapsed ? '▲' : '▼'}
        </button>

        <span style={titleStyle}>实时控制台</span>

        {!collapsed ? (
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: activeTab === t.id ? '1px solid rgba(201,168,76,0.35)' : '1px solid transparent',
                  background: activeTab === t.id ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: activeTab === t.id ? 'var(--text-accent)' : 'var(--text-tertiary)',
                  fontSize: 10,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        <div style={filterAreaStyle}>
          {activeTab === 'llm' ? (
            <span style={llmHintStyle}>监视 HTTP 耗时与响应；进行中可点下方「结束请求」</span>
          ) : (
            agentIds.map((id) => (
              <FilterChip
                key={id}
                label={id === 'all' ? '全部' : agentLabel(id)}
                active={filter === id}
                onClick={() => setFilter(id)}
              />
            ))
          )}
        </div>

        <span style={countStyle}>{activeTab === 'llm' ? '—' : `${filtered.length} 条`}</span>

        {activeTab === 'llm' ? null : (
          <button type="button" onClick={clearLogs} style={clearBtnStyle}>
            清空日志
          </button>
        )}
      </div>

      {!collapsed ? (
        activeTab === 'llm' ? (
          <LlmRequestPanel />
        ) : (
          <div style={logAreaStyle}>
            {filtered.length === 0 ? (
              <div style={emptyLogStyle}>暂无日志</div>
            ) : (
              filtered.map((log) => <LogRow key={log.id} log={log} agentLabel={agentLabel} />)
            )}
          </div>
        )
      ) : null}
    </div>
  );
}

// ── LlmRequestPanel (static styles extracted) ──────────────────────────────
const llmPanelStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '10px 14px 12px',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-secondary)',
  lineHeight: 1.55,
};

const llmNoteStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--text-tertiary)',
  marginBottom: 10,
  lineHeight: 1.5,
};

const loadingBoxStyle: CSSProperties = {
  padding: 12,
  borderRadius: 10,
  background: 'rgba(0,122,255,0.1)',
  border: '1px solid rgba(0,122,255,0.35)',
  marginBottom: 12,
};

const loadingHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap',
  marginBottom: 8,
};

const abortBtnStyle: CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,59,48,0.45)',
  background: 'rgba(255,59,48,0.12)',
  color: 'var(--status-rejected)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const clearItemBtnStyle: CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid var(--surface-border)',
  background: 'transparent',
  color: 'var(--text-tertiary)',
  fontSize: 10,
  cursor: 'pointer',
};

const emptyLlmStyle: CSSProperties = {
  color: 'var(--text-tertiary)',
  textAlign: 'center',
  padding: '20px 8px',
};

function LlmRequestPanel() {
  const status = useLlmActivityStore((s) => s.status);
  const phaseLabel = useLlmActivityStore((s) => s.phaseLabel);
  const startedAt = useLlmActivityStore((s) => s.startedAt);
  const pendingUrl = useLlmActivityStore((s) => s.pendingUrl);
  const pendingModel = useLlmActivityStore((s) => s.pendingModel);
  const last = useLlmActivityStore((s) => s.last);
  const abortInFlightUser = useLlmActivityStore((s) => s.abortInFlightUser);
  const clearDisplay = useLlmActivityStore((s) => s.clearDisplay);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status !== 'loading') return;
    const id = window.setInterval(() => setTick((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, [status]);

  const waitSec =
    status === 'loading' && startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0;

  return (
    <div style={llmPanelStyle}>
      <div style={llmNoteStyle}>
        此处展示<strong>真实</strong> HTTP 调用结果（测试连接 / 下旨自动模型）。与画布节点上的「运行中」演示状态<strong>无关</strong>。
      </div>

      {status === 'loading' ? (
        <div style={loadingBoxStyle}>
          <div style={loadingHeaderStyle}>
            <div style={{ color: 'var(--status-running)', fontWeight: 600 }}>请求进行中… {waitSec}s</div>
            <button type="button" onClick={() => abortInFlightUser()} style={abortBtnStyle}>
              结束请求
            </button>
          </div>
          <div style={{ wordBreak: 'break-all' }}>{phaseLabel}</div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>POST {pendingUrl}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>model: {pendingModel}</div>
        </div>
      ) : null}

      {status !== 'idle' && status !== 'loading' ? (
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8 }}>{phaseLabel}</div>
      ) : null}

      {last ? (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: 'var(--surface-base)',
            border: `1px solid ${last.ok ? 'rgba(52,199,89,0.35)' : 'rgba(255,59,48,0.35)'}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11 }}>
              <span style={{ color: last.ok ? 'var(--status-completed)' : 'var(--status-rejected)' }}>
                {last.ok ? '✓ 成功' : '✕ 失败'}
              </span>
              <span>{Math.round(last.durationMs)} ms</span>
              {last.httpStatus != null ? <span>HTTP {last.httpStatus}</span> : null}
              <span style={{ color: 'var(--text-tertiary)' }}>{formatTime(last.at)}</span>
            </div>
            <button type="button" onClick={() => clearDisplay()} style={clearItemBtnStyle}>
              清除本条
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>POST {last.urlDisplay}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>model: {last.model}</div>
          {last.error ? (
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--status-rejected)',
                fontSize: 11,
              }}
            >
              {last.error}
            </pre>
          ) : null}
          {last.snippet ? (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', color: 'var(--text-accent)', fontSize: 11 }}>
                响应正文（前 {last.responseChars ?? last.snippet.length} 字符）
              </summary>
              <pre
                style={{
                  margin: '8px 0 0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 11,
                  maxHeight: 160,
                  overflow: 'auto',
                }}
              >
                {last.snippet}
              </pre>
            </details>
          ) : null}
        </div>
      ) : status === 'idle' ? (
        <div style={emptyLlmStyle}>
          尚无请求记录。请打开「模型 / API」点击「测试连接」，或在运行模式下旨并勾选自动调用。
        </div>
      ) : null}
    </div>
  );
}

// ── LogRow ──────────────────────────────────────────────────────────────────
const LogRow = memo(function LogRow({
  log,
  agentLabel,
}: {
  log: LogEntry;
  agentLabel: (id: string) => string;
}) {
  return (
    <div style={logRowStyle}>
      <span style={logTimeStyle}>{formatTime(log.timestamp)}</span>
      <span
        style={{
          color: levelColor[log.level],
          flexShrink: 0,
          width: 10,
          textAlign: 'center',
          fontSize: 9,
        }}
      >
        {log.level === 'error' ? '✕' : log.level === 'warn' ? '!' : log.level === 'system' ? '◆' : '·'}
      </span>
      <span style={logAgentStyle}>{agentLabel(log.agentId)}</span>
      <span style={{ color: levelColor[log.level], flex: 1, wordBreak: 'break-word' }}>{log.message}</span>
      {log.taskId ? <span style={logTaskStyle}>#{log.taskId}</span> : null}
    </div>
  );
});

// ── FilterChip ─────────────────────────────────────────────────────────────
const filterChipBase: CSSProperties = {
  borderRadius: 4,
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  transition: 'all 0.12s ease',
  flexShrink: 0,
  padding: '2px 8px',
};

const FilterChip = memo(function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const style = useMemo<CSSProperties>(
    () => ({
      ...filterChipBase,
      border: active ? '1px solid rgba(201,168,76,0.4)' : '1px solid transparent',
      background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
      color: active ? 'var(--text-accent)' : 'var(--text-tertiary)',
    }),
    [active],
  );

  return (
    <button type="button" onClick={onClick} style={style}>
      {label}
    </button>
  );
});
