import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { DashboardMetricCards } from './DashboardMetricCards';
import { DashboardCharts } from './DashboardCharts';
import { Alert } from '@mule-platform/shared-types';
import { UploadCloud, RefreshCw, AlertCircle, ArrowUpRight, ShieldCheck, Database } from 'lucide-react';

interface DashboardScreenProps {
  onOpenCase: (caseId: string, alertId?: string) => void;
  onOpenUpload: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onOpenCase, onOpenUpload }) => {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: api.getDashboardSummary,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg)] p-8">
        <div className="flex items-center gap-2 text-[var(--ink-muted)] text-[13px] font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent)]" />
          Loading fraud surveillance telemetry...
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg)] p-8">
        <div className="bg-[var(--surface)] border border-[var(--danger)] p-6 rounded-[6px] max-w-md text-center">
          <AlertCircle className="w-8 h-8 text-[var(--danger)] mx-auto mb-2" />
          <h2 className="text-[14px] font-bold text-[var(--ink)]">Telemetry Service Unavailable</h2>
          <p className="text-[12px] text-[var(--ink-muted)] mt-1">
            {error instanceof Error ? error.message : 'Unable to connect to fraud intelligence API.'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-3 py-1.5 bg-[var(--accent)] text-white text-[12px] font-mono rounded-[4px] hover:bg-[var(--accent-hover)] transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[var(--bg)] p-4 space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-bold text-[var(--ink)] tracking-tight">
              Fraud Intelligence & Mule Surveillance
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-[var(--accent-soft)] text-[var(--accent)] rounded-[2px] border border-[var(--accent)]">
              Live Core
            </span>
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
            Operational dashboard tracking high-velocity pass-through, mule rings, and layered flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh telemetry"
            className="px-2.5 py-1 text-[11px] font-mono text-[var(--ink-muted)] hover:text-[var(--ink)] bg-[var(--surface)] border border-[var(--border)] rounded-[4px] inline-flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-3 py-1 bg-[var(--accent)] text-white text-[12px] font-medium rounded-[4px] hover:bg-[var(--accent-hover)] transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Ingest Transactions CSV</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <DashboardMetricCards data={data} />

      {/* Visual Analytics */}
      <DashboardCharts data={data} />

      {/* Recent High-Priority Alerts Section */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px]">
        <div className="p-3 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink)]">
              Latest Priority Detections
            </h2>
            <span className="text-[10px] font-mono text-[var(--ink-muted)]">
              ({data.recentAlerts.length} recent alerts)
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--ink-faint)]">
            Auto-scored with Isolation Forest + Rules
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] font-mono text-[var(--ink-muted)] bg-[var(--surface-sunk)]">
                <th className="py-2 px-3 w-28">Alert ID</th>
                <th className="py-2 px-3 w-36">Account</th>
                <th className="py-2 px-3 w-24">Risk Score</th>
                <th className="py-2 px-3">Primary Anomaly Signal</th>
                <th className="py-2 px-3 w-36 text-right">Flagged Amount</th>
                <th className="py-2 px-3 w-32">Status</th>
                <th className="py-2 px-3 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAlerts.map((alert: Alert) => {
                const isCritical = alert.riskScore >= 80;
                const isHigh = alert.riskScore >= 60 && alert.riskScore < 80;
                const scoreColor = isCritical
                  ? 'text-[var(--danger)] bg-red-500/10 border-red-500/30'
                  : isHigh
                  ? 'text-[var(--warn)] bg-amber-500/10 border-amber-500/30'
                  : 'text-[var(--accent)] bg-teal-500/10 border-teal-500/30';

                return (
                  <tr
                    key={alert.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--surface-sunk)] transition-colors h-[38px] text-[12px]"
                  >
                    <td className="py-2 px-3 font-mono text-[11px] text-[var(--ink)] font-semibold">
                      {alert.id}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[var(--ink)]">
                      {alert.accountId}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-block font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border ${scoreColor} tabular-nums`}>
                        {alert.riskScore}/100
                      </span>
                    </td>
                    <td className="py-2 px-3 truncate max-w-xs text-[var(--ink-muted)]" title={alert.signals?.join(', ')}>
                      {alert.signals?.[0] || 'Unusual transaction behavior'}
                    </td>
                    <td className="py-2 px-3 font-mono text-right tabular-nums font-medium text-[var(--ink)]">
                      ₹{alert.amountAtRiskINR?.toLocaleString('en-IN') || '0'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] uppercase text-[var(--ink-muted)]">
                      {alert.status}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => onOpenCase(`CASE-${alert.id}`, alert.id)}
                        className="text-[11px] font-mono text-[var(--accent)] hover:underline inline-flex items-center gap-0.5"
                      >
                        Inspect <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
