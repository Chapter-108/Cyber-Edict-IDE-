import { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useConsoleStore } from '@/store/useConsoleStore';
import { useLlmActivityStore } from '@/store/useLlmActivityStore';
import { formatTime } from '@/utils/helpers';
import type { LogEntry } from '@/types/agent';

export function Console() {
  const { logs, clearLogs, nodes } = useWorkflowStore();
  const { activeTab, setActiveTab } = useConsoleStore();
  const [filter, setFilter] = useState<string>('all');
  const [collapsed, setCollapsed] = useState(false);

  const agentIds = ['all', ...Array.from(new Set(logs.map((l) => l.agentId)))];
  const filtered = filter === 'all' ? logs : logs.filter((l) => l.agentId === filter);

  const agentLabel = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    return n?.data.label ?? id;
  };

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'flow', label: '三省' },
    { id: 'parallel', label: '六部' },
    { id: 'system', label: '系统' },
    { id: 'llm', label: '模型请求' },
  ];

  return (
    <div
      style={{
        height: collapsed ? 36 : 'var(--console-h)',
        borderTop: '1px solid var(--surface-border)',
        background: 'var(--surface-overlay)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'height 0.2s ease',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 36,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 10,
          borderBottom: collapsed ? 'none' : '1px solid var(--surface-border)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-tertiary)',
            fontSize: 12,
            padding: 0,
          }}
        >
          {collapsed ? '▲' : '▼'}
        </button>

        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
          }}
        >
          实时控制台
        </span>

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

        <div style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto', alignItems: 'center', minWidth: 0 }}>
          {activeTab === 'llm' ? (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4, paddingRight: 8 }}>
              监视 HTTP 耗时与响应；进行中可点下方「结束请求」
            </span>
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

        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {activeTab === 'llm' ? '—' : `${filtered.length} 条`}
        </span>

        {activeTab === 'llm' ? null : (
          <button
            type="button"
            onClick={clearLogs}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              fontSize: 11,
              padding: 0,
            }}
          >
            清空日志
          </button>
        )}
      </div>

      {!collapsed ? (
        activeTab === 'llm' ? (
          <LlmRequestPanel />
        ) : (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '4px 0',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: 16, color: 'var(--text-tertiary)', textAlign: 'center' }}>暂无日志</div>
            ) : (
              filtered.map((log) => <LogRow key={log.id} log={log} agentLabel={agentLabel} />)
            )}
          </div>
        )
      ) : null}
    </div>
  );
}

function LlmRequestPanel() {
  const { status, phaseLabel, startedAt, pendingUrl, pendingModel, last, abortInFlightUser, clearDisplay } =
    useLlmActivityStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status !== 'loading') return;
    const id = window.setInterval(() => setTick((n) => n + 1), 400);
    return () => window.clearInterval(id);
  }, [status]);

  const waitSec =
    status === 'loading' && startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0;

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 14px 12px',
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
      }}
    >
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 10, lineHeight: 1.5 }}>
        此处展示<strong>真实</strong> HTTP 调用结果（测试连接 / 下旨自动模型）。与画布节点上的「运行中」演示状态<strong>无关</strong>。
      </div>

      {status === 'loading' ? (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: 'rgba(0,122,255,0.1)',
            border: '1px solid rgba(0,122,255,0.35)',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 8,
            }}
          >
            <div style={{ color: 'var(--status-running)', fontWeight: 600 }}>
              请求进行中… {waitSec}s
            </div>
            <button
              type="button"
              onClick={() => abortInFlightUser()}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,59,48,0.45)',
                background: 'rgba(255,59,48,0.12)',
                color: 'var(--status-rejected)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
              }}
            >
              结束请求
            </button>
          </div>
          <div style={{ wordBreak: 'break-all' }}>{phaseLabel}</div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
            POST {pendingUrl}
          </div>
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
            <button
              type="button"
              onClick={() => clearDisplay()}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid var(--surface-border)',
                background: 'transparent',
                color: 'var(--text-tertiary)',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
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
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 8px' }}>
          尚无请求记录。请打开「模型 / API」点击「测试连接」，或在运行模式下旨并勾选自动调用。
        </div>
      ) : null}
    </div>
  );
}

function LogRow({ log, agentLabel }: { log: LogEntry; agentLabel: (id: string) => string }) {
  const levelColor: Record<string, string> = {
    info: 'var(--text-secondary)',
    warn: 'var(--status-reviewing)',
    error: 'var(--status-rejected)',
    system: 'var(--status-running)',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        padding: '3px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, fontSize: 10 }}>
        {formatTime(log.timestamp)}
      </span>
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
      <span style={{ color: 'var(--text-accent)', flexShrink: 0, fontSize: 10 }}>{agentLabel(log.agentId)}</span>
      <span style={{ color: levelColor[log.level], flex: 1, wordBreak: 'break-word' }}>{log.message}</span>
      {log.taskId ? (
        <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, fontSize: 10 }}>#{log.taskId}</span>
      ) : null}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        border: active ? '1px solid rgba(201,168,76,0.4)' : '1px solid transparent',
        background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
        color: active ? 'var(--text-accent)' : 'var(--text-tertiary)',
        fontSize: 11,
        cursor: 'pointer',
        fontFamily: 'var(--font-display)',
        transition: 'all 0.12s ease',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}
