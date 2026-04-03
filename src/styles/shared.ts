import type { CSSProperties } from 'react';

// ── Modal ──────────────────────────────────────────────────────────────────
export const modalOverlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

export const modalPanel: CSSProperties = {
  maxWidth: '100%',
  background: 'var(--surface-overlay)',
  border: '1px solid var(--surface-border-strong)',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
  display: 'flex',
  flexDirection: 'column',
};

// ── Input ──────────────────────────────────────────────────────────────────
export const inputStyle: CSSProperties = {
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

// ── Buttons ────────────────────────────────────────────────────────────────
export const btnPrimary: CSSProperties = {
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

export const btnSecondary: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--surface-border)',
  background: 'var(--surface-overlay)',
  color: 'var(--text-secondary)',
  fontSize: 13,
  cursor: 'pointer',
};

export const btnDanger: CSSProperties = {
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

export const btnGhost: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--surface-border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 13,
  cursor: 'pointer',
};
