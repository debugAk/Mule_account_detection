import React, { useState } from 'react';
import { Alert } from '@mule-platform/shared-types';
import { FileSpreadsheet, Activity, Network, ShieldCheck } from 'lucide-react';
import { CaseTransactionLedger } from './CaseTransactionLedger';
import { CaseVelocityTab } from './CaseVelocityTab';
import { CaseCounterpartyTab } from './CaseCounterpartyTab';

interface CaseWorkAreaPaneProps {
  alert: Alert;
  onAddToDraft: (item: string) => void;
}

export const CaseWorkAreaPane: React.FC<CaseWorkAreaPaneProps> = ({ alert, onAddToDraft }) => {
  const [activeTab, setActiveTab] = useState<'txns' | 'velocity' | 'counterparties' | 'rules'>('txns');

  const tabs = [
    { id: 'txns', label: 'Transaction Ledger', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { id: 'velocity', label: 'Velocity Analytics', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'counterparties', label: 'Counterparty Network', icon: <Network className="w-3.5 h-3.5" /> },
    { id: 'rules', label: 'Regulatory Directives', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-[var(--surface)] select-none">
      {/* Sub-tab navigation */}
      <div className="h-9 px-3 bg-[var(--surface-sunk)] border-b border-[var(--border)] flex items-center gap-1 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[12px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs border border-[var(--border)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'txns' && (
          <CaseTransactionLedger alert={alert} onAddToDraft={onAddToDraft} />
        )}

        {activeTab === 'velocity' && <CaseVelocityTab alert={alert} />}

        {activeTab === 'counterparties' && <CaseCounterpartyTab alert={alert} />}

        {activeTab === 'rules' && (
          <div className="p-4 space-y-3 overflow-y-auto max-w-[700px] text-[12px]">
            <div className="p-3 bg-[var(--surface-sunk)] border border-[var(--border)] rounded-[4px] space-y-1">
              <strong className="text-[var(--ink)] font-semibold">RBI Master Direction — KYC 2016 (Updated 2024)</strong>
              <p className="text-[var(--ink-muted)] leading-relaxed">
                Accounts exhibiting high pass-through velocities with near-zero retained balance across short windows require mandatory freeze of debit facilities pending re-KYC and PAN-Aadhaar linking validation.
              </p>
            </div>
            <div className="p-3 bg-[var(--surface-sunk)] border border-[var(--border)] rounded-[4px] space-y-1">
              <strong className="text-[var(--ink)] font-semibold">Section 12 PMLA 2002 — Reporting Obligation</strong>
              <p className="text-[var(--ink-muted)] leading-relaxed">
                Where transaction patterns demonstrate layering of criminal proceeds or structuring to evade thresholds, an STR must be submitted to FIU-IND within 7 working days.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
