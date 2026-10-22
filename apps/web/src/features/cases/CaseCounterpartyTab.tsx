import React from 'react';
import { Alert } from '@mule-platform/shared-types';
import { Network, Building2, CheckCircle } from 'lucide-react';

export const CaseCounterpartyTab: React.FC<{ alert: Alert }> = ({ alert }) => {
  const counterparties = [
    { id: 'HDFC-XXXX9921', name: 'M/S Royal Trading Co (Shell)', type: 'Beneficiary', volume: '₹18,40,000', hops: 1, flagged: true },
    { id: 'SBIN-XXXX4412', name: 'Amit Verma (Dormant Node)', type: 'Layering Proxy', volume: '₹12,10,000', hops: 1, flagged: true },
    { id: 'ICIC-XXXX7719', name: 'Crypto Exchange Escrow IN', type: 'Off-Ramp', volume: '₹9,80,000', hops: 2, flagged: false },
    { id: 'UTIB-XXXX3381', name: 'Unknown P2P Inward Source', type: 'Victim Inflow', volume: '₹14,50,000', hops: 1, flagged: true },
  ];

  return (
    <div className="p-4 space-y-3 overflow-y-auto select-none text-[12px]">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
        <span className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-[var(--accent)]" />
          Direct Counterparty Entities ({alert.graphDegree} Identified Edges)
        </span>
        <span className="font-mono text-[11px] text-[var(--ink-faint)]">Graph Radius: 2 hops</span>
      </div>

      <div className="space-y-2">
        {counterparties.map((c, i) => (
          <div
            key={i}
            className="p-2.5 bg-[var(--surface-sunk)] border border-[var(--border)] rounded-[4px] flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[var(--ink-muted)] shrink-0" strokeWidth={1.5} />
              <div>
                <div className="font-mono text-[12px] font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <span>{c.id}</span>
                  {c.flagged && (
                    <span className="px-1 py-0.2 bg-[var(--danger)]/15 text-[var(--danger)] text-[10px] rounded-[2px] font-sans">
                      FLAGGED
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--ink-muted)]">{c.name} · {c.type}</div>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[12px] font-bold text-[var(--ink)] tabular-nums">{c.volume}</span>
              <span className="text-[10px] text-[var(--ink-faint)] block">{c.hops} hop away</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
