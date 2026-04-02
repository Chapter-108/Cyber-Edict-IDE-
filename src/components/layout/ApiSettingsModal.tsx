import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useLlmSettingsStore } from '@/store/useLlmSettingsStore';
import { useLlmActivityStore } from '@/store/useLlmActivityStore';
import { chatCompletion, isLlmConfigured } from '@/utils/llmClient';

interface ApiSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ApiSettingsModal({ open, onClose }: ApiSettingsModalProps) {
  const s = useLlmSettingsStore();
  const abortInFlightUser = useLlmActivityStore((st) => st.abortInFlightUser);
  const llmLoading = useLlmActivityStore((st) => st.status === 'loading');
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [testMsg, setTestMsg] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setTestStatus('idle');
    setTestMsg('');
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
    });
  }, [open]);

  if (!open) return null;

  const missing = !s.baseUrl?.trim() || !s.apiKey?.trim() || !s.model?.trim();

  const runTest = async () => {
    if (!isLlmConfigured(s)) {
      setTestStatus('err');
      setTestMsg('请先填写下方「连接配置」中的 Base URL、API Key 与 Model（可向下滚动查看）。');
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTestStatus('loading');
    setTestMsg('');
    try {
      const reply = await chatCompletion({
        baseUrl: s.baseUrl.trim(),
        apiKey: s.apiKey,
        model: s.model.trim(),
        temperature: Math.min(s.temperature, 1),
        maxTokens: Math.min(s.maxTokens, 256),
        completionsPath: s.completionsPath.trim() || '/chat/completions',
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      });
      setTestStatus('ok');
      setTestMsg(reply.slice(0, 200));
    } catch (e) {
      setTestStatus('err');
      setTestMsg(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-fade-in"
        style={{
          width: 540,
          maxWidth: '100%',
          height: 'min(720px, 92vh)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--surface-overlay)',
          border: '1px solid var(--surface-border-strong)',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 固定页头 */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 18px 12px',
            borderBottom: '1px solid var(--surface-border)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            background: 'var(--surface-raised)',
          }}
        >
          <span style={{ fontSize: 20 }}>⚡</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              id="api-modal-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              模型与 API
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, lineHeight: 1.45 }}>
              OpenAI 兼容 <code style={{ fontSize: 10 }}>POST …/chat/completions</code>
              <br />
              密钥仅保存在本机浏览器 localStorage，不会上传到 Cyber-Edict 服务器。
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 4px',
            }}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {/* 可滚动表单区：确保 Base URL / Key 始终能滚到 */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{ padding: '14px 18px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {missing ? (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'rgba(255,149,0,0.12)',
                  border: '1px solid rgba(255,149,0,0.35)',
                  fontSize: 12,
                  color: 'var(--status-reviewing)',
                  lineHeight: 1.5,
                }}
              >
                <strong>连接未完成</strong>：请填写本节三项（Base URL、API Key、Model）。填好后可用底部「测试连接」验证；真实耗时与错误会显示在控制台「
                <strong>模型请求</strong>」页。
              </div>
            ) : null}

            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--text-accent)',
                textTransform: 'uppercase',
              }}
            >
              连接配置（必填）
            </div>

            <Field label="Base URL">
              <input
                value={s.baseUrl}
                onChange={(e) => s.setSettings({ baseUrl: e.target.value })}
                onBlur={(e) => s.setSettings({ baseUrl: e.target.value.trim() })}
                placeholder="https://api.openai.com/v1"
                style={input}
                autoComplete="url"
              />
            </Field>

            <Field label="API Key（Bearer）">
              <input
                type="password"
                value={s.apiKey}
                onChange={(e) => s.setSettings({ apiKey: e.target.value })}
                placeholder="sk-… 或兼容网关的 Token"
                autoComplete="off"
                style={input}
              />
            </Field>

            <Field label="Model">
              <input
                value={s.model}
                onChange={(e) => s.setSettings({ model: e.target.value })}
                onBlur={(e) => s.setSettings({ model: e.target.value.trim() })}
                placeholder="gpt-4o-mini"
                style={input}
              />
            </Field>

            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                marginTop: 4,
              }}
            >
              高级
            </div>

            <Field label="Completions 路径">
              <input
                value={s.completionsPath}
                onChange={(e) => s.setSettings({ completionsPath: e.target.value })}
                onBlur={(e) => {
                  const v = e.target.value.trim() || '/chat/completions';
                  s.setSettings({ completionsPath: v });
                }}
                placeholder="/chat/completions"
                style={input}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Temperature">
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={s.temperature}
                  onChange={(e) => s.setSettings({ temperature: parseFloat(e.target.value) || 0 })}
                  style={input}
                />
              </Field>
              <Field label="Max tokens">
                <input
                  type="number"
                  min={64}
                  max={128000}
                  step={256}
                  value={s.maxTokens}
                  onChange={(e) => s.setSettings({ maxTokens: parseInt(e.target.value, 10) || 1024 })}
                  style={input}
                />
              </Field>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                checked={s.autoInvokeOnDispatch}
                onChange={(e) => s.setSettings({ autoInvokeOnDispatch: e.target.checked })}
                style={{ marginTop: 3 }}
              />
              <span>
                运行模式下「下旨」后<strong>自动</strong>调用模型（中书省规划摘要写入控制台）。未勾选则<strong>不会</strong>发起网络请求。
              </span>
            </label>

            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.65 }}>
              浏览器直连第三方 API 常遇 <strong>CORS</strong> 拦截。可换带 CORS 的网关，或在{' '}
              <code style={{ fontSize: 10 }}>vite.config.ts</code> 里配置{' '}
              <code style={{ fontSize: 10 }}>server.proxy</code> 把本地路径转发到真实 API。
            </p>
          </div>
        </div>

        {/* 固定底栏：操作与测试结果 */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--surface-border)',
            padding: '12px 18px 14px',
            background: 'var(--surface-raised)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={runTest}
              disabled={testStatus === 'loading'}
              style={{
                ...btnPrimary,
                opacity: testStatus === 'loading' ? 0.75 : 1,
              }}
            >
              {testStatus === 'loading' ? '请求中…' : '测试连接'}
            </button>
            {testStatus === 'loading' && llmLoading ? (
              <button
                type="button"
                onClick={() => abortInFlightUser()}
                style={{
                  ...btnDanger,
                }}
              >
                结束测试
              </button>
            ) : null}
            <button type="button" onClick={() => s.resetToDefaults()} style={btnGhost}>
              恢复默认
            </button>
            <button type="button" onClick={onClose} style={btnGhost}>
              完成
            </button>
          </div>

          {testStatus !== 'idle' && testStatus !== 'loading' ? (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 120,
                overflowY: 'auto',
                background: testStatus === 'ok' ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)',
                border: `1px solid ${testStatus === 'ok' ? 'rgba(52,199,89,0.35)' : 'rgba(255,59,48,0.35)'}`,
                color: testStatus === 'ok' ? 'var(--status-completed)' : 'var(--status-rejected)',
              }}
            >
              {testStatus === 'ok' ? `✓ ${testMsg}` : `✕ ${testMsg}`}
            </div>
          ) : null}

          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
            单次请求超时 {120}s；耗时与端点摘要见控制台「模型请求」。
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const input: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid var(--surface-border-strong)',
  background: 'var(--surface-base)',
  color: 'var(--text-primary)',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'var(--font-mono)',
};

const btnPrimary: CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#007AFF',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const btnGhost: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--surface-border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 13,
  cursor: 'pointer',
};

const btnDanger: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,59,48,0.45)',
  background: 'rgba(255,59,48,0.12)',
  color: 'var(--status-rejected)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};
