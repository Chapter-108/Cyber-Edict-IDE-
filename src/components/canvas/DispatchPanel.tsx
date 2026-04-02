import { useState } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useLlmActivityStore } from '@/store/useLlmActivityStore';

/**
 * 运行模式：下旨（发布任务）→ 中书规划完成态 → 门下省审议弹窗
 *
 * 修复点：
 * 1. submitting 期间点击遮罩 / 按 × / ESC 均不关闭弹窗，防止用户以为已取消但节点仍卡死。
 * 2. submitting + llmLoading 时在弹窗底部固定展示「中止模型请求」条，不因弹窗状态变化消失。
 * 3. 弹窗右上角 × 在 submitting 期间变灰并禁用，视觉反馈明确。
 */
export function DispatchPanel() {
  const { mode, dispatchTask } = useWorkflowStore();
  const llmLoading = useLlmActivityStore((st) => st.status === 'loading');
  const abortInFlightUser = useLlmActivityStore((st) => st.abortInFlightUser);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (mode !== 'runtime') return null;

  const presets = [
    {
      label: '市场分析',
      title: '分析市场趋势并生成报告',
      desc: '对目标市场进行全面分析，包括竞品对比、数据统计和趋势预测，最终输出结构化报告。',
    },
    {
      label: '代码审查',
      title: '审查代码安全性与规范',
      desc: '对指定代码库进行安全扫描、规范检查和性能分析，输出审查报告和改进建议。',
    },
    {
      label: '周报生成',
      title: '生成本周工程团队周报',
      desc: '汇总本周工程进展、问题和计划，按标准格式输出团队周报。',
    },
  ];

  /** 尝试关闭弹窗 — submitting 期间阻止 */
  const tryClose = () => {
    if (submitting) return;
    setOpen(false);
  };

  const handleDispatch = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await dispatchTask(title, desc);
      setTitle('');
      setDesc('');
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── 下旨触发按钮 ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 20,
          padding: '10px 18px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, #C9A84C, #A8782A)',
          border: 'none',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.02em',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(201,168,76,0.5)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(201,168,76,0.35)';
        }}
      >
        <span style={{ fontSize: 16 }}>📜</span>
        下旨
      </button>

      {/* ── 弹窗遮罩 ─────────────────────────────────────────────────────── */}
      {open ? (
        <div
          role="presentation"
          onClick={(e) => {
            // submitting 期间禁止点击遮罩关闭
            if (e.target === e.currentTarget) tryClose();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: submitting ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          <div
            className="animate-fade-in"
            style={{
              width: 480,
              maxWidth: 'calc(100vw - 32px)',
              background: 'var(--surface-overlay)',
              border: `1px solid ${submitting ? 'rgba(0,122,255,0.3)' : 'var(--surface-border-strong)'}`,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 20px 14px',
                borderBottom: '1px solid var(--surface-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>📜</span>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  发布圣旨
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {submitting
                    ? '中书省正在处理，请等待…处理完成后弹窗自动关闭'
                    : '任务将由中书省接旨，经门下省审议后分发六部'}
                </div>
              </div>
              {/* × 按钮：submitting 期间禁用 */}
              <button
                type="button"
                onClick={tryClose}
                disabled={submitting}
                title={submitting ? '正在处理中，请等待完成' : '关闭'}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: submitting ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                  fontSize: 18,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  padding: 0,
                  opacity: submitting ? 0.35 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                ×
              </button>
            </div>

            {/* 旨意模板（submitting 期间隐藏，避免误操作） */}
            {!submitting ? (
              <div style={{ padding: '14px 20px 0' }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  旨意模板
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setTitle(p.title);
                        setDesc(p.desc);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--surface-border-strong)',
                        background: 'var(--surface-raised)',
                        color: 'var(--text-secondary)',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-display)',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 表单区域 */}
            <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}
                >
                  旨意标题 *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="一句话描述任务目标..."
                  autoFocus={!submitting}
                  readOnly={submitting}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: submitting ? 'var(--surface-base)' : 'var(--surface-raised)',
                    border: `1px solid ${title ? 'rgba(201,168,76,0.4)' : 'var(--surface-border-strong)'}`,
                    borderRadius: 8,
                    color: submitting ? 'var(--text-secondary)' : 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                    cursor: submitting ? 'default' : 'text',
                  }}
                />
              </div>
              <div>
                <label
                  style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}
                >
                  详细描述
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="补充任务背景、要求和输出格式..."
                  rows={4}
                  readOnly={submitting}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: submitting ? 'var(--surface-base)' : 'var(--surface-raised)',
                    border: '1px solid var(--surface-border-strong)',
                    borderRadius: 8,
                    color: submitting ? 'var(--text-secondary)' : 'var(--text-primary)',
                    fontSize: 13,
                    outline: 'none',
                    resize: submitting ? 'none' : 'vertical',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.6,
                    boxSizing: 'border-box',
                    cursor: submitting ? 'default' : 'text',
                  }}
                />
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => void handleDispatch()}
                  disabled={!title.trim() || submitting}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 8,
                    border: 'none',
                    background:
                      title.trim() && !submitting
                        ? 'linear-gradient(135deg, #C9A84C, #A8782A)'
                        : 'var(--surface-raised)',
                    color: title.trim() && !submitting ? '#fff' : 'var(--text-tertiary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: title.trim() && !submitting ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {submitting ? '处理中…请稍候' : '⚔ 发布旨意'}
                </button>
                <button
                  type="button"
                  onClick={tryClose}
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: '1px solid var(--surface-border)',
                    background: 'transparent',
                    color: submitting ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                    fontSize: 13,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.4 : 1,
                  }}
                >
                  取消
                </button>
              </div>

              {/* ── LLM 调用中止条（submitting + llmLoading 时显示） ─────────── */}
              {submitting && llmLoading ? (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(0,122,255,0.08)',
                    border: '1px solid rgba(0,122,255,0.25)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    {/* 转圈指示器 */}
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid rgba(0,122,255,0.3)',
                        borderTop: '2px solid #007AFF',
                        borderRadius: '50%',
                        flexShrink: 0,
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      中书省模型调用中（最长 60s 自动超时）
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => abortInFlightUser()}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,59,48,0.45)',
                      background: 'rgba(255,59,48,0.1)',
                      color: 'var(--status-rejected)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    立即结束请求
                  </button>
                </div>
              ) : null}

              {/* submitting 但 LLM 不再 loading（超时或已完成，等待流程推进）时的提示 */}
              {submitting && !llmLoading ? (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(201,168,76,0.08)',
                    border: '1px solid rgba(201,168,76,0.2)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  正在推进流程，请等待…弹窗将在门下省审议弹窗弹出后自动关闭。
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── 全局 spin keyframe（注入一次） ──────────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
