import React from 'react';
import { Alert } from '@mule-platform/shared-types';
import { ArrowRight, Clock, Percent, Activity } from 'lucide-react';

export const CaseVelocityTab: React.FC<{ alert: Alert }> = ({ alert }) => {
  return (
    <div className="p-4 space-y-4 overflow-y-auto max-w-[800px] text-[13px] select-none">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-[var(--surface-sunk)] border border-[var(--border)] rounded-[4px]">
          <span className="text-[11px] text-[var(--ink-muted)] flex items-center gap-1 uppercase font-semibold">
            <Percent className="w-3.5 h-3.5 text-[var(--accent)]" />
            Pass-Through Rate
          </span>
          <div className="mt-1 font-mono text-[20px] font-bold text-[var(--ink)] tabular-nums">
            {(alert.passThroughRatio * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-[var(--ink-muted)] mt-1 block">
            Funds routed immediately to counterparty layer
          </span>
        </div>

        <div className="p-3 bg-[var(--surface-sunk)] border border-[var(--border)] rounded-[4px]">
          <span className="text-[11px] text-[var(--ink-muted)] flex items-center gap-1 uppercase font-semibold">
            <Clock className="w-3.5 h-3.5 text-[var(--warn)]" />
            Mean Holding Time
          </span>
          <div className="mt-1 font-mono text-[20px] font-bold text-[var(--warn)] tabular-nums">
            14.2 mins
          </div>
          <span className="text-[11px] text-[var(--ink-muted)] mt-1 block">
            Severe anomaly compared to 72h benchmark
          </span>
        </div>

        <div className="p-3 bg-[var(--surface-sunk)] border border-[var(--border)] rounded-[4px]">
          <span className="text-[11px] text-[var(--ink-muted)] flex items-center gap-1 uppercase font-semibold">
            <Activity className="w-3.5 h-3.5 text-[var(--danger)]" />
            Velocity Index
          </span>
          <div className="mt-1 font-mono text-[20px] font-bold text-[var(--danger)] tabular-nums">
            9.8 / 10
          </div>
          <span className="text-[11px] text-[var(--ink-muted)] mt-1 block">
            Top 1% rapid dispersal percentile
          </span>
        </div>
      </div>

      {/* Layering Visualizer */}
      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[4px]">
        <div className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase mb-2">
          Flow Dispersal Topology (Source to Counterparties)
        </div>
        <div className="flex items-center justify-between p-3 bg-[var(--surface-sunk)] rounded-[4px] font-mono text-[12px]">
          <div className="text-center">
            <span className="text-[10px] uppercase text-[var(--ink-muted)] block">Inward Deposit</span>
            <strong className="text-[var(--success)]">₹4,80,000</strong>
            <span className="text-[10px] text-[var(--ink-faint)] block">UPI P2P Inflow</span>
          </div>

          <ArrowRight className="w-4 h-4 text-[var(--accent)] shrink-0 animate-pulse" />

          <div className="text-center p-2 border border-[var(--accent)] bg-[var(--accent-soft)]/30 rounded-[4px]">
            <span className="text-[10px] uppercase text-[var(--accent)] font-bold block">Target Mule Node</span>
            <strong className="text-[var(--ink)]">{alert.accountId}</strong>
            <span className="text-[10px] text-[var(--ink-muted)] block">Retention &lt; 0.5%</span>
          </div>

          <ArrowRight className="w-4 h-4 text-[var(--danger)] shrink-0" />

          <div className="text-center">
            <span className="text-[10px] uppercase text-[var(--ink-muted)] block">Dispersal Output</span>
            <strong className="text-[var(--danger)]">₹4,77,200</strong>
            <span className="text-[10px] text-[var(--ink-faint)] block">4 IMPS Tranches</span>
          </div>
        </div>
      </div>
    </div>
  );
};
