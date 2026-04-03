import { useState, useMemo, type CSSProperties } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { modalOverlay as sharedOverlay } from '@/styles/shared';
import type { WorkflowTask } from '@/types/workflow';

interface ReviewModalProps {
  task: WorkflowTask;
  onClose: () => void;
}

// ── Static styles ──────────────────────────────────────────────────────────
const overlayStyle: CSSProperties = {
  ...sharedOverlay,
  background: 'rgba(0,0,0,0.65)',
  padding: 0,
};

const panelStyle: CSSProperties = {
  width: 460,
  maxWidth: 'calc(100vw - 32px)',
  background: 'var(--surface-overlay)',
  border: '1px solid rgba(255,149,0,0.3)',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 0 0 1px rgba(255,149,0,0.1), 0 24px 64px rgba(0,0,0,0.5)',
};

const headerStyle: CSSProperties = {
  padding: '16px 20px 14px',
  borderBottom: '1px solid var(--surface-border)',
  background: 'rgba(255,149,0,0.06)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const closeBtnStyle: CSSProperties = {
  marginLeft: 'auto',
  background: 'none',
  border: 'none',
  color: 'var(--text-tertiary)',
  fontSize: 18,
  cursor: 'pointer',
};

const contentSectionStyle: CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid var(--surface-border)',
};

const contentLabelStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--text-tertiary)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const approveDescStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--text-secondary)',
  lineHeight: 1.7,
  marginBottom: 16,
};

const approveBtnStyle: CSSProperties = {
  width: '100%',
  padding: '11px 0',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #34C759, #248A3D)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  boxShadow: '0 4px 12px rgba(52,199,89,0.3)',
};

const textareaBaseStyle: CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: 'var(--surface-raised)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  resize: 'none',
  fontFamily: 'var(--font-body)',
  lineHeight: 1.6,
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

const deferBtnStyle: CSSProperties = {
  flex: 1,
  minWidth: 120,
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--surface-border-strong)',
  background: 'var(--surface-raised)',
  color: 'var(--text-secondary)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const terminateBtnStyle: CSSProperties = {
  flex: 1,
  minWidth: 120,
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(142,142,147,0.5)',
  background: 'rgba(142,142,147,0.12)',
  color: 'var(--text-tertiary)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

export function ReviewModal({ task, onClose }: ReviewModalProps) {
  const approveReview = useWorkflowStore((s) => s.approveReview);
  const rejectReview = useWorkflowStore((s) => s.rejectReview);
  const stopTask = useWorkflowStore((s) => s.stopTask);
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'approve' | 'reject'>('approve');

  const handleApprove = () => {
    approveReview(task.id);
    onClose();
  };

  const handleReject = () => {
    if (!notes.trim()) return;
    rejectReview(task.id, notes);
    onClose();
  };

  const handleDefer = () => {
    onClose();
  };

  const handleTerminate = () => {
    stopTask(task.id);
    onClose();
  };

  const rejectBtnStyle = useMemo<CSSProperties>(
    () => ({
      width: '100%',
      padding: '11px 0',
      borderRadius: 8,
      border: 'none',
      background: notes.trim()
        ? 'linear-gradient(135deg, #FF3B30, #C0392B)'
        : 'var(--surface-raised)',
      color: notes.trim() ? '#fff' : 'var(--text-tertiary)',
      fontSize: 13,
      fontWeight: 600,
      cursor: notes.trim() ? 'pointer' : 'not-allowed',
      fontFamily: 'var(--font-display)',
      boxShadow: notes.trim() ? '0 4px 12px rgba(255,59,48,0.3)' : 'none',
      transition: 'all 0.15s ease',
    }),
    [notes],
  );

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="review-modal-title" style={overlayStyle}>
      <div className="animate-fade-in" style={panelStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: 22 }}>🔍</span>
          <div>
            <div
              id="review-modal-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              门下省审议
            </div>
            <div style={{ fontSize: 11, color: 'var(--status-reviewing)', marginTop: 2 }}>{task.title}</div>
          </div>
          <button type="button" onClick={onClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <div style={contentSectionStyle}>
          <div style={contentLabelStyle}>旨意内容</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            {task.description || task.title}
          </p>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)' }}>
          {(['approve', 'reject'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color:
                  tab === t
                    ? t === 'approve'
                      ? 'var(--status-completed)'
                      : 'var(--status-rejected)'
                    : 'var(--text-tertiary)',
                borderBottom:
                  tab === t
                    ? `2px solid ${t === 'approve' ? 'var(--status-completed)' : 'var(--status-rejected)'}`
                    : '2px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              {t === 'approve' ? '✅ 准奏' : '🚫 封驳'}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px 20px' }}>
          {tab === 'approve' ? (
            <>
              <p style={approveDescStyle}>
                确认方案合理，逻辑完备，无风险项。准奏后任务将移交尚书省分发六部执行。
              </p>
              <button type="button" onClick={handleApprove} style={approveBtnStyle}>
                ✅ 准奏，移交尚书省
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}
                >
                  封驳理由 *（将退回中书省重新规划）
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="说明方案存在的问题，中书省将据此修改..."
                  rows={4}
                  autoFocus
                  style={{
                    ...textareaBaseStyle,
                    border: `1px solid ${notes ? 'rgba(255,59,48,0.4)' : 'var(--surface-border-strong)'}`,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleReject}
                disabled={!notes.trim()}
                style={rejectBtnStyle}
              >
                🚫 封驳，退回中书省
              </button>
            </>
          )}

          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid var(--surface-border)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <button type="button" onClick={handleDefer} style={deferBtnStyle}>
              稍后再审
            </button>
            <button
              type="button"
              onClick={handleTerminate}
              title="将旨意标记为已终止，不进入尚书省"
              style={terminateBtnStyle}
            >
              终止旨意
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
