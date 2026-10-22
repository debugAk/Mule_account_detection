import React from 'react';
import { Alert } from '@mule-platform/shared-types';
import { PlusCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@mule-platform/ui-kit';

interface CaseTransactionLedgerProps {
  alert: Alert;
  onAddToDraft: (item: string) => void;
}

export const CaseTransactionLedger: React.FC<CaseTransactionLedgerProps> = ({ alert, onAddToDraft }) => {
  // Generate realistic transactions calibrated to the alert's actual amount & pass-through
  const transactions = React.useMemo(() => {
    const list = [];
    const baseAmt = Math.round(alert.amountAtRiskINR / 8);
    const dateBase = new Date(alert.timestamp).getTime();

    for (let i = 0; i < 12; i++) {
      const isCredit = i % 2 === 0;
      const amt = Math.round((baseAmt * (0.85 + (i * 0.04))) / 100) * 100;
      const time = new Date(dateBase - (i * 18 * 60 * 1000)).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      }) + ' IST';

      const narration = isCredit
        ? `UPI/CR/${840100 + i * 29}/P2P/layering_inward_${i}`
        : `IMPS/DR/${920300 + i * 17}/rapid_dispersal_outward_${i}`;

      list.push({
        id: `TXN-${88290 + i}`,
        time,
        isCredit,
        amount: amt,
        balance: isCredit ? amt * 1.05 : amt * 0.02,
        narration,
        beneficiary: isCredit ? 'Telegram Inward Node' : 'Mule Counterparty Branch',
      });
    }
    return list;
  }, [alert]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-8 px-3 bg-[var(--surface-sunk)] border-b border-[var(--border)] flex items-center justify-between text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider select-none shrink-0">
        <div className="w-[100px] shrink-0">Txn Time</div>
        <div className="w-[80px] shrink-0">Txn ID</div>
        <div className="w-[60px] shrink-0">Type</div>
        <div className="w-[110px] shrink-0 text-right pr-2">Amount (INR)</div>
        <div className="w-[90px] shrink-0 text-right pr-2">Balance</div>
        <div className="flex-1 truncate pl-2">Narration / Beneficiary</div>
        <div className="w-[90px] shrink-0 text-right">Action</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {transactions.map(t => (
          <div
            key={t.id}
            className="flex items-center h-[36px] px-3 border-b border-[var(--border)] text-[12px] hover:bg-[var(--surface-sunk)]/60 transition-colors select-none"
          >
            <div className="w-[100px] shrink-0 font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
              {t.time}
            </div>
            <div className="w-[80px] shrink-0 font-mono text-[11px] text-[var(--ink)] font-medium">
              {t.id}
            </div>
            <div className="w-[60px] shrink-0">
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1 py-0.2 rounded-[2px] ${
                  t.isCredit
                    ? 'bg-[var(--success)]/15 text-[var(--success)]'
                    : 'bg-[var(--danger)]/15 text-[var(--danger)]'
                }`}
              >
                {t.isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {t.isCredit ? 'CR' : 'DR'}
              </span>
            </div>
            <div className="w-[110px] shrink-0 font-mono text-right pr-2 tabular-nums font-semibold text-[var(--ink)]">
              ₹{t.amount.toLocaleString('en-IN')}
            </div>
            <div className="w-[90px] shrink-0 font-mono text-right pr-2 tabular-nums text-[var(--ink-muted)] text-[11px]">
              ₹{Math.round(t.balance).toLocaleString('en-IN')}
            </div>
            <div className="flex-1 truncate pl-2 font-mono text-[11px] text-[var(--ink-muted)]">
              {t.narration}
            </div>
            <div className="w-[90px] shrink-0 text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddToDraft(`${t.id}: ₹${t.amount.toLocaleString('en-IN')} (${t.isCredit ? 'Credit' : 'Debit'} - ${t.narration})`)}
                icon={<PlusCircle className="w-3 h-3 text-[var(--accent)]" />}
              >
                Cite
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
