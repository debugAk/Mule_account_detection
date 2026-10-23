import React from 'react';
import { DashboardSummaryResponse } from '@mule-platform/shared-types';
import { ShieldAlert, AlertTriangle, Layers, Activity, IndianRupee } from 'lucide-react';

export const DashboardMetricCards: React.FC<{ data: DashboardSummaryResponse }> = ({ data }) => {
  const m = data.metrics;
  const formattedExposure = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(m.flaggedTransactionValueINR);

  return (
    <div className="grid grid-cols-4 gap-3 select-none">
      {/* Total Transactions Analyzed */}
      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[4px]">
        <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
          <span className="uppercase font-semibold tracking-wider">Txns Analyzed</span>
          <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
        </div>
        <div className="mt-1 font-mono text-[22px] font-bold text-[var(--ink)] tabular-nums">
          {m.totalTransactionsAnalyzed.toLocaleString('en-IN')}
        </div>
        <span className="text-[11px] text-[var(--ink-muted)] mt-0.5 block">
          Across {m.totalAccounts} monitored accounts
        </span>
      </div>

      {/* Flagged Transaction Value */}
      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[4px]">
        <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
          <span className="uppercase font-semibold tracking-wider">Flagged Exposure</span>
          <IndianRupee className="w-3.5 h-3.5 text-[var(--danger)]" />
        </div>
        <div className="mt-1 font-mono text-[20px] font-bold text-[var(--danger)] tabular-nums truncate">
          {formattedExposure}
        </div>
        <span className="text-[11px] text-[var(--ink-muted)] mt-0.5 block">
          Critical & High mule volume
        </span>
      </div>

      {/* Active Alerts */}
      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[4px]">
        <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
          <span className="uppercase font-semibold tracking-wider">Critical Alerts</span>
          <AlertTriangle className="w-3.5 h-3.5 text-[var(--warn)]" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-[22px] font-bold text-[var(--warn)] tabular-nums">
            {m.alertsSummary.critical}
          </span>
          <span className="font-mono text-[12px] text-[var(--ink-muted)]">
            / {m.alertsSummary.total} total
          </span>
        </div>
        <span className="text-[11px] text-[var(--ink-muted)] mt-0.5 block">
          {m.alertsSummary.high} High · {m.alertsSummary.medium} Medium
        </span>
      </div>

      {/* Open Investigations */}
      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[4px]">
        <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
          <span className="uppercase font-semibold tracking-wider">Open Cases</span>
          <Layers className="w-3.5 h-3.5 text-[var(--secondary)]" />
        </div>
        <div className="mt-1 font-mono text-[22px] font-bold text-[var(--secondary)] tabular-nums">
          {m.openInvestigations}
        </div>
        <span className="text-[11px] text-[var(--ink-muted)] mt-0.5 block">
          Active analyst investigations
        </span>
      </div>
    </div>
  );
};
