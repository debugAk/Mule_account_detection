import React, { useState } from 'react';
import { DashboardSummaryResponse } from '@mule-platform/shared-types';

interface DashboardChartsProps {
  data: DashboardSummaryResponse;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  const [hoveredTrend, setHoveredTrend] = useState<number | null>(null);
  const totalRiskAlerts = data.riskDistribution.reduce((acc, cur) => acc + cur.count, 0) || 1;

  // Find max count for scaling trend bars
  const maxTrendCount = Math.max(...data.transactionTrends.map((t) => t.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Risk Distribution Card */}
      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink)]">
              Risk Tier Composition
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              {totalRiskAlerts} alerts classified
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {data.riskDistribution.map((item) => {
              const pct = Math.round((item.count / totalRiskAlerts) * 100);
              const colorMap: Record<string, string> = {
                critical: 'var(--danger)',
                high: 'var(--warn)',
                medium: 'var(--secondary)',
                low: 'var(--accent)',
              };
              const barColor = colorMap[item.tier.toLowerCase()] || 'var(--ink-muted)';

              return (
                <div key={item.tier} className="group">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold uppercase tracking-wide text-[var(--ink)] flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: barColor }}
                      />
                      {item.tier}
                    </span>
                    <span className="font-mono tabular-nums text-[var(--ink-muted)]">
                      {item.count}{' '}
                      <span className="text-[var(--ink-faint)]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-[var(--surface-sunk)] h-2 rounded-[2px] overflow-hidden border border-[var(--border)]">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--ink-faint)] flex items-center justify-between">
          <span>Model: Isolation Forest + Heuristic Rules</span>
          <span>Dual-engine scoring</span>
        </div>
      </div>

      {/* 7-Day Transaction & Volume Activity */}
      <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--ink)]">
              Transaction Volume & Activity
            </span>
            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
              Last 7 Days (IST)
            </span>
          </div>

          <div className="mt-4 flex items-end justify-between gap-2 h-28 px-1">
            {data.transactionTrends.map((trend, idx) => {
              const heightPct = Math.max(12, Math.round((trend.count / maxTrendCount) * 100));
              const isHovered = hoveredTrend === idx;
              const formattedVol = (trend.volumeINR / 100000).toFixed(1) + 'L';

              return (
                <div
                  key={trend.date}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredTrend(idx)}
                  onMouseLeave={() => setHoveredTrend(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-10 bg-[var(--ink)] text-[var(--bg)] text-[10px] font-mono px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                      <div>{trend.date}: {trend.count} txns</div>
                      <div className="text-[var(--border)]">₹{trend.volumeINR.toLocaleString('en-IN')}</div>
                    </div>
                  )}

                  {/* Volume hint */}
                  <span className="text-[9px] font-mono text-[var(--ink-faint)] tabular-nums mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{formattedVol}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[28px] bg-[var(--surface-sunk)] border border-[var(--border)] rounded-t-[2px] flex items-end overflow-hidden h-20">
                    <div
                      className={`w-full transition-all duration-200 ${
                        isHovered ? 'bg-[var(--accent-hover)]' : 'bg-[var(--accent)]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>

                  {/* Date label */}
                  <span className="mt-1.5 text-[10px] font-mono text-[var(--ink-muted)]">
                    {trend.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
          <span>Peak volume tracked</span>
          <span className="font-mono text-[var(--ink)]">Max {maxTrendCount} txns/day</span>
        </div>
      </div>
    </div>
  );
};
