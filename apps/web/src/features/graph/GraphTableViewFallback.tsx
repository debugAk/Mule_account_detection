import React from 'react';
import { SEED_GRAPH_ELEMENTS } from './graphData';
import { Badge } from '@mule-platform/ui-kit';

export const GraphTableViewFallback: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--surface)] text-[12px] select-none">
      <div className="h-8 px-3 bg-[var(--surface-sunk)] border-b border-[var(--border)] flex items-center justify-between text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider shrink-0">
        <div className="w-[120px] shrink-0">Node ID</div>
        <div className="w-[160px] shrink-0">Entity Label</div>
        <div className="w-[100px] shrink-0">Type</div>
        <div className="w-[80px] shrink-0 text-right pr-2">Risk</div>
        <div className="flex-1 truncate pl-2">Role & Attribution</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {SEED_GRAPH_ELEMENTS.nodes.map(n => (
          <div
            key={n.data.id}
            className="flex items-center h-[36px] px-3 border-b border-[var(--border)] text-[12px] hover:bg-[var(--surface-sunk)]/50 transition-colors"
          >
            <div className="w-[120px] shrink-0 font-mono text-[11px] text-[var(--ink-muted)]">
              {n.data.id}
            </div>
            <div className="w-[160px] shrink-0 font-mono text-[12px] font-semibold text-[var(--ink)]">
              {n.data.label}
            </div>
            <div className="w-[100px] shrink-0">
              <Badge variant={n.data.type === 'beneficiary' ? 'critical' : n.data.type === 'device' ? 'warning' : 'accent'}>
                {n.data.type.toUpperCase()}
              </Badge>
            </div>
            <div className="w-[80px] shrink-0 font-mono text-right pr-2 tabular-nums font-semibold text-[var(--ink)]">
              {n.data.riskScore ?? '—'}
            </div>
            <div className="flex-1 truncate pl-2 text-[11px] text-[var(--ink-muted)]">
              {n.data.subtext}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
