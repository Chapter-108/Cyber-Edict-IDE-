import type { AgentRole, AgentStatus, Ministry } from '../types/agent';

export function statusColor(s: AgentStatus): string {
  switch (s) {
    case 'running':
      return 'var(--status-running)';
    case 'reviewing':
      return 'var(--status-reviewing)';
    case 'completed':
      return 'var(--status-completed)';
    case 'rejected':
      return 'var(--status-rejected)';
    case 'blocked':
      return 'var(--status-blocked)';
    default:
      return 'var(--status-idle)';
  }
}

export function statusBg(s: AgentStatus): string {
  const c = statusColor(s);
  return `${c}20`;
}

export function statusLabel(s: AgentStatus): string {
  const map: Record<AgentStatus, string> = {
    idle: '空闲',
    running: '运行中',
    reviewing: '审核中',
    completed: '已完成',
    rejected: '已驳回',
    blocked: '阻塞',
  };
  return map[s];
}

export function roleIcon(role: AgentRole): string {
  const map: Record<AgentRole, string> = {
    Zhongshu: '📜',
    Menxia: '🔍',
    Shangshu: '📮',
    Worker: '⚙️',
  };
  return map[role];
}

export function roleColor(role: AgentRole): string {
  const map: Record<AgentRole, string> = {
    Zhongshu: '#c9a84c',
    Menxia: '#ff9500',
    Shangshu: '#007aff',
    Worker: '#8e8e93',
  };
  return map[role];
}

export function roleLabel(role: AgentRole): string {
  const map: Record<AgentRole, string> = {
    Zhongshu: '中书省',
    Menxia: '门下省',
    Shangshu: '尚书省',
    Worker: '六部',
  };
  return map[role];
}

export function ministryIcon(m?: Ministry): string {
  const map: Record<Ministry, string> = {
    Hu: '💰',
    Li: '📝',
    Bing: '⚔️',
    Xing: '⚖️',
    Gong: '🔧',
    Li_personnel: '📋',
  };
  return m ? map[m] : '⚙️';
}

export function ministryColor(m?: Ministry): string {
  const map: Record<Ministry, string> = {
    Hu: '#34c759',
    Li: '#5ac8fa',
    Bing: '#ff3b30',
    Xing: '#af52de',
    Gong: '#8e8e93',
    Li_personnel: '#c9a84c',
  };
  return m ? map[m] : '#8e8e93';
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const p = (x: number) => x.toString().padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
