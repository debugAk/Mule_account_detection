import React, { useRef } from 'react';
import { Alert } from '@mule-platform/shared-types';
import { InlineRiskBar, Badge, cn } from '@mule-platform/ui-kit';
import { Lock, Eye } from 'lucide-react';

interface AlertTableRowProps {
  alert: Alert;
  isSelected: boolean;
  isActive: boolean;
  onToggleSelect: (id: string, e?: React.MouseEvent) => void;
  onSelectRow: (alert: Alert) => void;
  onPeekHover: (alert: Alert, rect: DOMRect) => void;
  onPeekLeave: () => void;
  onRevealPii: (alert: Alert) => void;
}

export const AlertTableRow: React.FC<AlertTableRowProps> = ({
  alert,
  isSelected,
  isActive,
  onToggleSelect,
  onSelectRow,
  onPeekHover,
  onPeekLeave,
  onRevealPii,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      if (rowRef.current) {
        onPeekHover(alert, rowRef.current.getBoundingClientRect());
      }
    }, 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    onPeekLeave();
  };

  const formattedINR = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(alert.amountAtRiskINR);

  const timeFormatted = new Date(alert.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }) + ' IST';

  return (
    <div
      ref={rowRef}
      role="row"
      aria-selected={isSelected}
      onClick={() => onSelectRow(alert)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group flex items-center h-[36px] px-3 border-b border-[var(--border)] text-[12px] cursor-pointer transition-colors duration-[120ms] select-none',
        isActive ? 'bg-[var(--surface-sunk)] signature-rail' : isSelected ? 'bg-[var(--accent-soft)]/50' : 'hover:bg-[var(--surface-sunk)]/60 bg-[var(--surface)]'
      )}
    >
      {/* Checkbox */}
      <div className="w-[36px] shrink-0 flex items-center" onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => onToggleSelect(alert.id, e as unknown as React.MouseEvent)}
          aria-label={`Select alert ${alert.id}`}
          className="w-3.5 h-3.5 rounded-[2px] border-[var(--border)] text-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
        />
      </div>

      {/* Risk Score */}
      <div className="w-[84px] shrink-0 pr-3">
        <InlineRiskBar score={alert.riskScore} />
      </div>

      {/* Account / Masked PII */}
      <div className="w-[150px] shrink-0 flex items-center gap-1 font-mono text-[12px] text-[var(--ink)]">
        {alert.isRestricted ? (
          <span className="flex items-center gap-1 text-[var(--ink-faint)] italic text-[11px]">
            <Lock className="w-3 h-3 text-[var(--warn)]" strokeWidth={1.5} />
            <button
              onClick={e => {
                e.stopPropagation();
                onRevealPii(alert);
              }}
              className="text-[var(--ink-muted)] hover:text-[var(--accent)] underline underline-offset-2 transition-colors"
            >
              Restricted · request access
            </button>
          </span>
        ) : (
          <div className="flex items-center gap-1 group/acc">
            <span className="font-semibold">{alert.accountId}</span>
            <button
              onClick={e => {
                e.stopPropagation();
                onRevealPii(alert);
              }}
              className="opacity-0 group-hover/acc:opacity-100 p-0.5 text-[var(--ink-muted)] hover:text-[var(--accent)] transition-opacity"
              title="Reveal audit-logged full identifier"
              aria-label="Request unmasking with audit scope"
            >
              <Eye className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      {/* Bank & Type */}
      <div className="w-[140px] shrink-0 truncate text-[var(--ink-muted)] text-[11px]">
        {alert.bankName}
        {alert.ringId && (
          <span className="ml-1 px-1 py-0.2 bg-[var(--accent-soft)] text-[var(--accent)] rounded-[2px] font-mono text-[10px]">
            RING
          </span>
        )}
      </div>

      {/* Pass-through ratio */}
      <div className="w-[80px] shrink-0 text-right pr-3 font-mono tabular-nums text-[var(--ink)]">
        {alert.passThroughRatio.toFixed(2)}
      </div>

      {/* Graph Degree */}
      <div className="w-[64px] shrink-0 text-right pr-3 font-mono tabular-nums text-[var(--ink)]">
        {alert.graphDegree}
      </div>

      {/* Account Age */}
      <div className="w-[54px] shrink-0 text-right pr-3 font-mono tabular-nums text-[var(--ink)]">
        {alert.accountAgeDays}d
      </div>

      {/* Amount at Risk */}
      <div className="w-[110px] shrink-0 text-right pr-3 font-mono tabular-nums font-medium text-[var(--ink)]">
        {formattedINR}
      </div>

      {/* Status Pill */}
      <div className="w-[80px] shrink-0">
        <Badge
          variant={
            alert.status === 'INVESTIGATING'
              ? 'accent'
              : alert.riskTier === 'CRITICAL'
              ? 'critical'
              : alert.riskTier === 'HIGH'
              ? 'high'
              : 'neutral'
          }
        >
          {alert.status === 'INVESTIGATING' ? 'TRIAGING' : alert.riskTier}
        </Badge>
      </div>

      {/* Time */}
      <div className="w-[84px] shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
        {timeFormatted}
      </div>
    </div>
  );
};
