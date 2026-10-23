import React, { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon, ShieldAlert, Wifi, RefreshCw, UploadCloud } from 'lucide-react';

interface HeaderProps {
  lastSynced?: string;
  isReconnecting?: boolean;
  onRefresh?: () => void;
  onOpenUpload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lastSynced,
  isReconnecting = false,
  onRefresh,
  onOpenUpload,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [secondsAgo, setSecondsAgo] = useState(12);
  const [slaSeconds, setSlaSeconds] = useState(3 * 3600 + 42 * 60 + 19); // 03h 42m 19s

  // Live timer for "last synced Xs ago"
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset secondsAgo when lastSynced changes
  useEffect(() => {
    if (lastSynced) {
      setSecondsAgo(0);
    }
  }, [lastSynced]);

  // Live countdown for SLA
  useEffect(() => {
    const timer = setInterval(() => {
      setSlaSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSla = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const slaIsRed = slaSeconds < 3600;
  const slaIsAmber = slaSeconds < 4 * 3600 && !slaIsRed;
  const isStale = secondsAgo > 90;

  return (
    <header className="h-11 px-4 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between shrink-0 select-none">
      {/* Brand & Workspace title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-[13px] tracking-tight text-[var(--ink)]">
          <ShieldAlert className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} aria-hidden="true" />
          <span>MULE SENTINEL</span>
        </div>
        <span className="text-[var(--border)]">|</span>
        <span className="text-[12px] text-[var(--ink-muted)]">Investigator Workspace</span>
        <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-[var(--surface-sunk)] text-[var(--ink-faint)] border border-[var(--border)] rounded-[2px]">
          DC1-IN-WEST
        </span>
      </div>

      {/* Right side operational instrumentation */}
      <div className="flex items-center gap-4 text-[12px]">
        {/* SLA Clock */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] border font-mono text-[11px] ${
            slaIsRed
              ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30 font-semibold'
              : slaIsAmber
              ? 'bg-[var(--warn)]/10 text-[var(--warn)] border-[var(--warn)]/30 font-medium'
              : 'bg-[var(--surface-sunk)] text-[var(--ink-muted)] border-[var(--border)]'
          }`}
          title="Nearest high-priority regulatory triage SLA deadline"
        >
          <span className="text-[10px] uppercase font-sans text-[var(--ink-faint)]">SLA</span>
          <span className="tabular-nums tracking-wide">{formatSla(slaSeconds)}</span>
        </div>

        {/* Sync status with relative seconds */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isReconnecting
                ? 'bg-[var(--warn)] animate-ping'
                : isStale
                ? 'bg-[var(--warn)]'
                : 'bg-[var(--success)]'
            }`}
          />
          <span
            className={`tabular-nums ${
              isStale ? 'text-[var(--warn)] font-medium' : 'text-[var(--ink-muted)]'
            }`}
          >
            {isReconnecting ? 'Reconnecting...' : `last synced ${secondsAgo}s ago`}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink)] rounded-[2px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              aria-label="Refresh alerts now"
              title="Manual sync"
            >
              <RefreshCw className="w-3 h-3" strokeWidth={1.5} />
            </button>
          )}
        </div>

        <span className="text-[var(--border)]">|</span>

        {/* Analyst session */}
        <div className="flex items-center gap-2 text-[12px] text-[var(--ink-muted)] font-mono">
          <span>ANALYST-104</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-sunk)] rounded-[4px] border border-transparent hover:border-[var(--border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          aria-label={`Switch to ${theme === 'daylight' ? 'Night Ledger (dark)' : 'Daylight Ledger (light)'} theme`}
          title={`Theme: ${theme === 'daylight' ? 'Daylight Ledger' : 'Night Ledger'}`}
        >
          {theme === 'daylight' ? (
            <Moon className="w-4 h-4" strokeWidth={1.5} />
          ) : (
            <Sun className="w-4 h-4" strokeWidth={1.5} />
          )}
        </button>

        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-mono text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-[4px] border border-[var(--border)] transition-colors"
            title="Import transaction or SOA CSV"
          >
            <UploadCloud className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Ingest</span>
          </button>
        )}
      </div>
    </header>
  );
};
