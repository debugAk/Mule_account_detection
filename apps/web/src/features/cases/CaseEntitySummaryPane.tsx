import React from 'react';
import { Alert } from '@mule-platform/shared-types';
import { InlineRiskBar, Badge } from '@mule-platform/ui-kit';
import { ShieldAlert, User, Building, MapPin, Hash, Zap } from 'lucide-react';

interface CaseEntitySummaryPaneProps {
  alert: Alert;
  width: number;
}

export const CaseEntitySummaryPane: React.FC<CaseEntitySummaryPaneProps> = ({ alert, width }) => {
  const formattedINR = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(alert.amountAtRiskINR);

  return (
    <aside
      style={{ width }}
      className="bg-[var(--surface-sunk)] border-r border-[var(--border)] flex flex-col h-full overflow-y-auto p-3 text-[12px] select-none shrink-0"
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          Entity Summary
        </span>
        <Badge
          variant={
            alert.riskTier === 'CRITICAL'
              ? 'critical'
              : alert.riskTier === 'HIGH'
              ? 'high'
              : 'neutral'
          }
        >
          {alert.riskTier}
        </Badge>
      </div>

      {/* Account ID & Bank */}
      <div className="mt-3 p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[14px] font-bold text-[var(--ink)]">{alert.accountId}</span>
          <span className="text-[11px] font-mono text-[var(--ink-muted)]">{alert.ifsc}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)]">
          <Building className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
          <span>{alert.bankName} · Mumbai Central SOL-8812</span>
        </div>
      </div>

      {/* Holder Details */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--ink-muted)] flex items-center gap-1">
            <User className="w-3.5 h-3.5" strokeWidth={1.5} />
            Holder Masked:
          </span>
          <span className="font-mono text-[var(--ink)] font-medium">{alert.accountHolderMasked}</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--ink-muted)] flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" strokeWidth={1.5} />
            UPI Virtual ID:
          </span>
          <span className="font-mono text-[var(--ink)]">{alert.upiHandleMasked}</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--ink-muted)] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
            Branch Location:
          </span>
          <span className="text-[var(--ink)]">Mumbai Suburban (MH)</span>
        </div>
      </div>

      {/* Risk Metrics Card */}
      <div className="mt-4 p-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase">Calibrated Risk</span>
          <InlineRiskBar score={alert.riskScore} />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-[11px]">
          <div>
            <span className="text-[var(--ink-muted)] block">Pass-Through</span>
            <span className="font-mono text-[13px] font-bold text-[var(--ink)] tabular-nums">
              {(alert.passThroughRatio * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-[var(--ink-muted)] block">Graph Degree</span>
            <span className="font-mono text-[13px] font-bold text-[var(--ink)] tabular-nums">
              {alert.graphDegree} nodes
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border)]">
          <span className="text-[11px] text-[var(--ink-muted)] block">Turnover Volume</span>
          <span className="font-mono text-[14px] font-bold text-[var(--accent)] tabular-nums">
            {formattedINR}
          </span>
        </div>
      </div>

      {/* Heuristic Signals */}
      <div className="mt-4 space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
          Primary Rule Triggers
        </span>
        {alert.signals.map((sig, i) => (
          <div key={i} className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] text-[11px] leading-snug flex items-start gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 mt-0.5" strokeWidth={1.5} />
            <span className="text-[var(--ink)]">{sig}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};
