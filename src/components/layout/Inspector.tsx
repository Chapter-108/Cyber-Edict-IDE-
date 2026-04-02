import type { CSSProperties, ReactNode } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useInspectorStore } from '@/store/useInspectorStore';
import {
  statusColor,
  statusLabel,
  statusBg,
  roleLabel,
  roleColor,
  ministryIcon,
  roleIcon,
  formatTokens,
  formatTime,
} from '@/utils/helpers';

export function Inspector() {
  const { nodes, selectedNodeId, mode } = useWorkflowStore();
  const { isEditing, draftSoul, startEditing, discardEdit, commitEdit, updateDraftSoul } = useInspectorStore();

  const node = nodes.find((n) => n.id === selectedNodeId);
  const data = node?.data;

  if (!data) {
    return (
      <aside style={panelStyle}>
        <EmptyState />
      </aside>
    );
  }

  const icon = data.role === 'Worker' ? ministryIcon(data.ministry) : roleIcon(data.role);
  const soul = isEditing && draftSoul ? draftSoul : data.soulConfig;

  return (
    <aside style={panelStyle} className="animate-slide-right">
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--surface-border)',
          background: 'rgba(0,122,255,0.08)',
          fontSize: 11,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
        }}
      >
        <strong style={{ color: 'var(--status-running)' }}>演示说明</strong>
        ：三省初始为<strong>空闲</strong>；「状态 / Token / 日志摘要」多为本地示例。大模型仅在配置 API 且
        <strong> 测试连接</strong> 或<strong> 下旨并勾选自动调用</strong> 时才会请求网络；进度与错误请看控制台
        <strong>「模型请求」</strong>页。
      </div>
      <div
        style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid var(--surface-border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {data.label}
          </div>
          <div style={{ fontSize: 11, color: roleColor(data.role), marginTop: 2 }}>
            {roleLabel(data.role)} · {soul.role}
          </div>
        </div>

        <div
          style={{
            padding: '3px 8px',
            borderRadius: 20,
            background: statusBg(data.status),
            border: `1px solid ${statusColor(data.status)}40`,
            fontSize: 11,
            fontWeight: 500,
            color: statusColor(data.status),
            flexShrink: 0,
          }}
        >
          {statusLabel(data.status)}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            borderBottom: '1px solid var(--surface-border)',
          }}
        >
          <Stat label="Tokens" value={data.tokenCount ? formatTokens(data.tokenCount) : '—'} />
          <Stat label="最后活跃" value={data.lastActive ? formatTime(data.lastActive) : '—'} />
        </div>

        <Section
          label="SOUL 配置"
          action={
            mode === 'design' && !isEditing
              ? { label: '编辑', onClick: startEditing }
              : isEditing
                ? { label: '取消', onClick: discardEdit }
                : undefined
          }
        >
          <Field label="Model" mono>
            {isEditing ? (
              <input
                value={draftSoul?.model ?? ''}
                onChange={(e) => updateDraftSoul({ model: e.target.value })}
                style={inputStyle}
              />
            ) : (
              <span style={{ color: 'var(--text-accent)' }}>{soul.model}</span>
            )}
          </Field>
          <Field label="Temperature" mono>
            {isEditing ? (
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={draftSoul?.temperature ?? 0.7}
                onChange={(e) => updateDraftSoul({ temperature: parseFloat(e.target.value) })}
                style={inputStyle}
              />
            ) : (
              soul.temperature
            )}
          </Field>
          <Field label="Max Tokens" mono>
            {isEditing ? (
              <input
                type="number"
                step={256}
                value={draftSoul?.maxTokens ?? 4096}
                onChange={(e) => updateDraftSoul({ maxTokens: parseInt(e.target.value, 10) })}
                style={inputStyle}
              />
            ) : (
              soul.maxTokens
            )}
          </Field>
        </Section>

        <Section label="人格 · Persona">
          {isEditing ? (
            <textarea
              value={draftSoul?.persona ?? ''}
              onChange={(e) => updateDraftSoul({ persona: e.target.value })}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, padding: '2px 0' }}>
              {soul.persona}
            </p>
          )}
        </Section>

        <Section label="技能 · Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {soul.skills.map((s) => (
              <span
                key={s}
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(201,168,76,0.1)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  fontSize: 11,
                  color: 'var(--text-accent)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </Section>

        <Section label="规则 · Rules">
          {soul.rules.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '4px 0',
                borderBottom: i < soul.rules.length - 1 ? '1px solid var(--surface-border)' : 'none',
              }}
            >
              <span
                style={{
                  color: 'var(--text-accent)',
                  fontSize: 11,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {(i + 1).toString().padStart(2, '0')}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r}</span>
            </div>
          ))}
        </Section>

        <Section label="最近日志">
          {data.logs.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>暂无日志</span>
          ) : (
            data.logs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '5px 0',
                  borderBottom: '1px solid var(--surface-border)',
                  fontSize: 11,
                }}
              >
                <div
                  style={{
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: 2,
                  }}
                >
                  {formatTime(log.timestamp)}
                </div>
                <div
                  style={{
                    color:
                      log.level === 'error'
                        ? 'var(--status-rejected)'
                        : log.level === 'warn'
                          ? 'var(--status-reviewing)'
                          : 'var(--text-secondary)',
                  }}
                >
                  {log.message}
                </div>
              </div>
            ))
          )}
        </Section>
      </div>

      {isEditing ? (
        <div
          style={{
            padding: '10px 14px',
            borderTop: '1px solid var(--surface-border)',
            display: 'flex',
            gap: 8,
          }}
        >
          <button type="button" onClick={() => commitEdit()} style={btnPrimary}>
            保存配置
          </button>
          <button type="button" onClick={discardEdit} style={btnSecondary}>
            取消
          </button>
        </div>
      ) : null}
    </aside>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        color: 'var(--text-tertiary)',
        padding: '32px 16px',
      }}
    >
      <span style={{ fontSize: 32, opacity: 0.4 }}>📋</span>
      <div style={{ textAlign: 'center', lineHeight: 1.65, maxWidth: 220 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>未选中节点</div>
        <span style={{ fontSize: 12 }}>
          在画布上点击任意 Agent 圆点，即可在此查看 SOUL、状态与日志摘要。
        </span>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
  action,
}: {
  label: string;
  children: ReactNode;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div style={{ borderBottom: '1px solid var(--surface-border)' }}>
      <div
        style={{
          padding: '10px 14px 6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              fontSize: 11,
              color: 'var(--status-running)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {action.label}
          </button>
        ) : null}
      </div>
      <div style={{ padding: '0 14px 12px' }}>{children}</div>
    </div>
  );
}

function Field({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          color: 'var(--text-primary)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        }}
      >
        {children}
      </span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 14px', background: 'var(--surface-overlay)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  );
}

const panelStyle: CSSProperties = {
  width: 'var(--inspector-w)',
  height: '100%',
  background: 'var(--surface-raised)',
  borderLeft: '1px solid var(--surface-border)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flexShrink: 0,
};

const inputStyle: CSSProperties = {
  background: 'var(--surface-overlay)',
  border: '1px solid var(--surface-border-strong)',
  borderRadius: 'var(--radius-sm)',
  padding: '4px 8px',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  width: '100%',
  outline: 'none',
};

const btnPrimary: CSSProperties = {
  flex: 1,
  padding: '7px 0',
  borderRadius: 'var(--radius-sm)',
  background: '#007AFF',
  border: 'none',
  color: '#fff',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
};

const btnSecondary: CSSProperties = {
  flex: 1,
  padding: '7px 0',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--surface-overlay)',
  border: '1px solid var(--surface-border)',
  color: 'var(--text-secondary)',
  fontSize: 12,
  cursor: 'pointer',
};
