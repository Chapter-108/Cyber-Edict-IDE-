import { useState, useMemo, type CSSProperties } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useLlmSettingsStore } from '@/store/useLlmSettingsStore';
import { useLlmActivityStore } from '@/store/useLlmActivityStore';
import type { WorkflowMode } from '@/types/agent';
import { isLlmConfigured } from '@/utils/llmClient';
import { ApiSettingsModal } from '@/components/layout/ApiSettingsModal';

// ── Static styles ──────────────────────────────────────────────────────────
const logoWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginRight: 8,
};

const logoTextStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--text-accent)',
  letterSpacing: '0.02em',
};

const logoSubStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
  marginLeft: 2,
};

const agentCountStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--text-tertiary)',
  fontFamily: 'var(--font-mono)',
};

const abortBtnStyle: CSSProperties = {
  padding: '5px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,59,48,0.45)',
  background: 'rgba(255,59,48,0.1)',
  color: 'var(--status-rejected)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const abortDotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 2,
  background: 'var(--status-rejected)',
  animation: 'pulse-dot 1.2s ease-in-out infinite',
};

const reviewBtnStyle: CSSProperties = {
  padding: '4px 12px',
  borderRadius: 8,
  border: '1px solid rgba(255,149,0,0.35)',
  background: 'rgba(255,149,0,0.1)',
  color: 'var(--status-reviewing)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const pillDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  animation: 'pulse-dot 2s ease-in-out infinite',
};

const modeHintStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--text-tertiary)',
  maxWidth: 200,
  textAlign: 'right',
  lineHeight: 1.35,
};

export function Navbar() {
  const mode = useWorkflowStore((s) => s.mode);
  const setMode = useWorkflowStore((s) => s.setMode);
  const nodes = useWorkflowStore((s) => s.nodes);
  const tasks = useWorkflowStore((s) => s.tasks);
  const activeTaskId = useWorkflowStore((s) => s.activeTaskId);
  const focusReviewTask = useWorkflowStore((s) => s.focusReviewTask);
  const llmReady = useLlmSettingsStore((st) => isLlmConfigured(st));
  const llmLoading = useLlmActivityStore((st) => st.status === 'loading');
  const abortInFlightUser = useLlmActivityStore((st) => st.abortInFlightUser);
  const [apiOpen, setApiOpen] = useState(false);

  const running = useMemo(() => nodes.filter((n) => n.data.status === 'running').length, [nodes]);
  const reviewing = useMemo(() => nodes.filter((n) => n.data.status === 'reviewing').length, [nodes]);
  const completed = useMemo(() => nodes.filter((n) => n.data.status === 'completed').length, [nodes]);
  const pendingEdictReview = tasks.some((t) => t.status === 'reviewing');
  const showResumeReview = mode === 'runtime' && pendingEdictReview && activeTaskId === null;

  const navStyle = useMemo<CSSProperties>(
    () => ({
      height: 'var(--navbar-h)',
      background:
        mode === 'runtime'
          ? 'linear-gradient(180deg, rgba(12,14,22,0.92) 0%, rgba(10,10,15,0.88) 100%)'
          : 'rgba(10,10,15,0.85)',
      backdropFilter: 'var(--blur-md)',
      WebkitBackdropFilter: 'var(--blur-md)',
      borderBottom:
        mode === 'runtime'
          ? '1px solid rgba(201,168,76,0.22)'
          : '1px solid rgba(0,122,255,0.18)',
      boxShadow:
        mode === 'runtime'
          ? 'inset 0 -1px 0 rgba(201,168,76,0.08)'
          : 'inset 0 -1px 0 rgba(0,122,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 16,
      position: 'relative',
      zIndex: 100,
      flexShrink: 0,
      transition: 'border-color 0.35s ease, background 0.35s ease, box-shadow 0.35s ease',
    }),
    [mode],
  );

  const dividerStyle = useMemo<CSSProperties>(
    () => ({
      width: 1,
      height: 20,
      background: mode === 'runtime' ? 'rgba(201,168,76,0.25)' : 'rgba(0,122,255,0.2)',
      transition: 'background 0.35s ease',
    }),
    [mode],
  );

  const apiBtnStyle = useMemo<CSSProperties>(
    () => ({
      padding: '5px 12px',
      borderRadius: 8,
      border: `1px solid ${llmReady ? 'rgba(52,199,89,0.35)' : 'var(--surface-border)'}`,
      background: llmReady ? 'rgba(52,199,89,0.08)' : 'var(--surface-raised)',
      color: llmReady ? 'var(--status-completed)' : 'var(--text-secondary)',
      fontSize: 12,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'var(--font-display)',
      transition: 'all 0.2s ease',
    }),
    [llmReady],
  );

  return (
    <nav style={navStyle}>
      <div style={logoWrapStyle}>
        <span style={{ fontSize: 18 }}>⚔</span>
        <span style={logoTextStyle}>Cyber-Edict</span>
        <span style={logoSubStyle}>IDE</span>
      </div>

      <div style={dividerStyle} />

      <div style={{ display: 'flex', gap: 8 }}>
        <StatusPill count={running} label="运行中" color="var(--status-running)" />
        <StatusPill count={reviewing} label="审核中" color="var(--status-reviewing)" />
        <StatusPill count={completed} label="已完成" color="var(--status-completed)" />
      </div>

      <div style={{ flex: 1 }} />

      {llmLoading ? (
        <button
          type="button"
          onClick={() => abortInFlightUser()}
          title="中止当前模型 HTTP 请求（测试连接或下旨自动调用）"
          style={abortBtnStyle}
        >
          <span style={abortDotStyle} />
          结束请求
        </button>
      ) : null}

      {showResumeReview ? (
        <button type="button" onClick={() => focusReviewTask()} style={reviewBtnStyle}>
          🔍 继续审议
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setApiOpen(true)}
        title="配置 OpenAI 兼容 API 与模型"
        style={apiBtnStyle}
      >
        ⚡ 模型 / API{llmReady ? ' · 已填' : ''}
      </button>

      <ModeSwitch mode={mode} onSwitch={setMode} />

      <div style={agentCountStyle}>{nodes.length} agents</div>

      <ApiSettingsModal open={apiOpen} onClose={() => setApiOpen(false)} />
    </nav>
  );
}

function StatusPill({ count, label, color }: { count: number; label: string; color: string }) {
  if (count === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        borderRadius: 20,
        background: `${color}18`,
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ ...pillDotStyle, background: color }} />
      <span style={{ fontSize: 12, color, fontWeight: 500 }}>{count}</span>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}

function ModeSwitch({ mode, onSwitch }: { mode: WorkflowMode; onSwitch: (m: WorkflowMode) => void }) {
  const modes: WorkflowMode[] = ['design', 'runtime'];
  const isDesign = mode === 'design';

  const trackStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      display: 'inline-flex',
      borderRadius: 11,
      padding: 3,
      background: isDesign ? 'rgba(0,122,255,0.14)' : 'rgba(201,168,76,0.16)',
      border: `1px solid ${isDesign ? 'rgba(0,122,255,0.45)' : 'rgba(201,168,76,0.48)'}`,
      boxShadow: isDesign
        ? '0 0 24px rgba(0,122,255,0.18), inset 0 1px 0 rgba(255,255,255,0.06)'
        : '0 0 24px rgba(201,168,76,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
      transition:
        'background 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.35s ease, box-shadow 0.35s ease',
    }),
    [isDesign],
  );

  const thumbStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      top: 3,
      left: isDesign ? 3 : '50%',
      width: 'calc(50% - 3px)',
      height: 'calc(100% - 6px)',
      borderRadius: 8,
      background: isDesign
        ? 'linear-gradient(180deg, #3a9fff 0%, #007AFF 100%)'
        : 'linear-gradient(180deg, #dfc069 0%, #C9A84C 100%)',
      boxShadow: isDesign
        ? '0 2px 8px rgba(0,122,255,0.45)'
        : '0 2px 8px rgba(201,168,76,0.45)',
      transition:
        'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease, box-shadow 0.3s ease',
      zIndex: 0,
    }),
    [isDesign],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <div style={trackStyle}>
        <div aria-hidden style={thumbStyle} />
        {modes.map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onSwitch(m)}
              style={{
                position: 'relative',
                zIndex: 1,
                flex: 1,
                minWidth: 88,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: active ? '#fff' : 'var(--text-tertiary)',
                textShadow: active ? '0 1px 2px rgba(0,0,0,0.25)' : 'none',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.02em',
                transition: 'color 0.22s ease',
              }}
            >
              {m === 'design' ? '✏ 设计' : '▶ 运行'}
            </button>
          );
        })}
      </div>
      <span key={mode} className="animate-fade-in" style={modeHintStyle}>
        {mode === 'design'
          ? '画布可编辑 · 编排节点与 SOUL'
          : '画布只读 · 下旨 / 门下省 · 可接模型 API'}
      </span>
    </div>
  );
}
