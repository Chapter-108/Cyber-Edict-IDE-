import { useState, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { useLlmSettingsStore } from '@/store/useLlmSettingsStore';
import { useLlmActivityStore } from '@/store/useLlmActivityStore';
import { chatCompletion, isLlmConfigured } from '@/utils/llmClient';
import {
  modalOverlay as sharedOverlay,
  modalPanel as sharedPanel,
  inputStyle as sharedInput,
  btnPrimary as sharedBtnPrimary,
  btnDanger as sharedBtnDanger,
  btnGhost as sharedBtnGhost,
} from '@/styles/shared';

interface ApiSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

// ── Local overrides / static styles ────────────────────────────────────────
const overlayStyle: CSSProperties = { ...sharedOverlay, zIndex: 1100 };

const panelStyle: CSSProperties = {
  ...sharedPanel,
  width: 540,
  height: 'min(720px, 92vh)',
  maxHeight: '92vh',
};

const headerStyle: CSSProperties = {
  flexShrink: 0,
  padding: '14px 18px 12px',
  borderBottom: '1px solid var(--surface-border)',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  background: 'var(--surface-raised)',
};

const closeBtnStyle: CSSProperties = {
  flexShrink: 0,
  background: 'none',
  border: 'none',
  color: 'var(--text-tertiary)',
  fontSize: 22,
  cursor: 'pointer',
  lineHeight: 1,
  padding: '0 4px',
};

const scrollAreaStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
};

const footerStyle: CSSProperties = {
  flexShrink: 0,
  borderTop: '1px solid var(--surface-border)',
  padding: '12px 18px 14px',
  background: 'var(--surface-raised)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const sectionLabelRequired: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: 'var(--text-accent)',
  textTransform: 'uppercase',
};

const sectionLabelAdvanced: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  marginTop: 4,
};

export function ApiSettingsModal({ open, onClose }: ApiSettingsModalProps) {
  const baseUrl = useLlmSettingsStore((s) => s.baseUrl);
  const apiKey = useLlmSettingsStore((s) => s.apiKey);
  const model = useLlmSettingsStore((s) => s.model);
  const temperature = useLlmSettingsStore((s) => s.temperature);
  const maxTokens = useLlmSettingsStore((s) => s.maxTokens);
  const completionsPath = useLlmSettingsStore((s) => s.completionsPath);
  const autoInvokeOnDispatch = useLlmSettingsStore((s) => s.autoInvokeOnDispatch);
  const setSettings = useLlmSettingsStore((s) => s.setSettings);
  const resetToDefaults = useLlmSettingsStore((s) => s.resetToDefaults);

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

  const missing = !baseUrl?.trim() || !apiKey?.trim() || !model?.trim();

  const runTest = async () => {
    if (!isLlmConfigured({ baseUrl, apiKey, model })) {
      setTestStatus('err');
      setTestMsg('请先填写下方「连接配置」中的 Base URL、API Key 与 Model（可向下滚动查看）。');
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setTestStatus('loading');
    setTestMsg('');
    try {
      const reply = await chatCompletion({
        baseUrl: baseUrl.trim(),
        apiKey,
        model: model.trim(),
        temperature: Math.min(temperature, 1),
        maxTokens: Math.min(maxTokens, 256),
        completionsPath: completionsPath.trim() || '/chat/completions',
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
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-fade-in"
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 固定页头 */}
        <div style={headerStyle}>
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
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="关闭">
            ×
          </button>
        </div>

        {/* 可滚动表单区 */}
        <div ref={scrollRef} style={scrollAreaStyle}>
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

            <div style={sectionLabelRequired}>连接配置（必填）</div>

            <Field label="Base URL">
              <input
                value={baseUrl}
                onChange={(e) => setSettings({ baseUrl: e.target.value })}
                onBlur={(e) => setSettings({ baseUrl: e.target.value.trim() })}
                placeholder="https://api.openai.com/v1"
                style={sharedInput}
                autoComplete="url"
              />
            </Field>

            <Field label="API Key（Bearer）">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setSettings({ apiKey: e.target.value })}
                placeholder="sk-… 或兼容网关的 Token"
                autoComplete="off"
                style={sharedInput}
              />
            </Field>

            <Field label="Model">
              <input
                value={model}
                onChange={(e) => setSettings({ model: e.target.value })}
                onBlur={(e) => setSettings({ model: e.target.value.trim() })}
                placeholder="gpt-4o-mini"
                style={sharedInput}
              />
            </Field>

            <div style={sectionLabelAdvanced}>高级</div>

            <Field label="Completions 路径">
              <input
                value={completionsPath}
                onChange={(e) => setSettings({ completionsPath: e.target.value })}
                onBlur={(e) => {
                  const v = e.target.value.trim() || '/chat/completions';
                  setSettings({ completionsPath: v });
                }}
                placeholder="/chat/completions"
                style={sharedInput}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Temperature">
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setSettings({ temperature: parseFloat(e.target.value) || 0 })}
                  style={sharedInput}
                />
              </Field>
              <Field label="Max tokens">
                <input
                  type="number"
                  min={64}
                  max={128000}
                  step={256}
                  value={maxTokens}
                  onChange={(e) => setSettings({ maxTokens: parseInt(e.target.value, 10) || 1024 })}
                  style={sharedInput}
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
                checked={autoInvokeOnDispatch}
                onChange={(e) => setSettings({ autoInvokeOnDispatch: e.target.checked })}
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

        {/* 固定底栏 */}
        <div style={footerStyle}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={runTest}
              disabled={testStatus === 'loading'}
              style={{ ...sharedBtnPrimary, opacity: testStatus === 'loading' ? 0.75 : 1 }}
            >
              {testStatus === 'loading' ? '请求中…' : '测试连接'}
            </button>
            {testStatus === 'loading' && llmLoading ? (
              <button type="button" onClick={() => abortInFlightUser()} style={sharedBtnDanger}>
                结束测试
              </button>
            ) : null}
            <button type="button" onClick={() => resetToDefaults()} style={sharedBtnGhost}>
              恢复默认
            </button>
            <button type="button" onClick={onClose} style={sharedBtnGhost}>
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
