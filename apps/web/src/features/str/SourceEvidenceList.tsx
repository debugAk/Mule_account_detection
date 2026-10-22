import React from 'react';
import { Button } from '@mule-platform/ui-kit';
import { Plus, FileText, Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SourceEvidenceItem {
  id: string;
  category: 'transaction' | 'heuristic' | 'device' | 'kyc';
  title: string;
  details: string;
  citationText: string;
}

const EVIDENCE_ITEMS: SourceEvidenceItem[] = [
  {
    id: 'EV-1',
    category: 'heuristic',
    title: '99.1% Rapid Dispersal Ratio',
    details: '₹16,54,01,140 credited across 60,656 transactions and routed to 0 residual balance within 14 mins.',
    citationText: '[EVID: 99.1% Pass-Through on HDFC-XXXX9416]',
  },
  {
    id: 'EV-2',
    category: 'device',
    title: 'Shared Hardware Fingerprint',
    details: 'Device token DEV-F7B2 linked to 9 dormant student accounts across Mumbai Suburban SOL-8812.',
    citationText: '[EVID: Device Cluster DEV-F7B2-991A]',
  },
  {
    id: 'EV-3',
    category: 'transaction',
    title: 'Layering via IMPS Batches',
    details: 'TXN-88291: 16 inward UPI deposits structured into 4 equal RTGS transfers to shell beneficiary.',
    citationText: '[EVID: TXN-88291 IMPS Layering]',
  },
  {
    id: 'EV-4',
    category: 'kyc',
    title: 'Income vs Turnover Discrepancy',
    details: 'Account holder declared income < ₹1.5L/year; ₹12.4 Crore velocity in 48 hours without business license.',
    citationText: '[EVID: KYC Form 60 Inconsistency]',
  },
];

export const SourceEvidenceList: React.FC<{ onAddEvidence: (citation: string) => void }> = ({ onAddEvidence }) => {
  return (
    <aside className="w-[360px] bg-[var(--surface-sunk)] border-r border-[var(--border)] flex flex-col h-full overflow-hidden shrink-0 select-none">
      <div className="h-9 px-3 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider shrink-0">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
          Source Evidence Repository
        </span>
        <span className="font-mono text-[10px] text-[var(--ink-faint)]">4 items</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {EVIDENCE_ITEMS.map(item => (
          <div
            key={item.id}
            className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[12px] text-[var(--ink)] flex items-center gap-1.5">
                {item.category === 'device' ? (
                  <Cpu className="w-3.5 h-3.5 text-[var(--secondary)]" />
                ) : item.category === 'heuristic' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--danger)]" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
                )}
                {item.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddEvidence(item.citationText)}
                icon={<Plus className="w-3 h-3 text-[var(--accent)]" />}
              >
                Insert
              </Button>
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] leading-snug">{item.details}</p>
            <div className="font-mono text-[10px] text-[var(--accent)] bg-[var(--accent-soft)]/40 px-1.5 py-0.5 rounded-[2px] inline-block">
              {item.citationText}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
