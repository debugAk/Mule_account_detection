import React from 'react';
import { Button } from '@mule-platform/ui-kit';
import { Send, Download, FileCheck, CheckCircle2 } from 'lucide-react';

interface StrDocumentComposerProps {
  narrativeText: string;
  onNarrativeChange: (text: string) => void;
  onSubmitStr: () => void;
}

export const StrDocumentComposer: React.FC<StrDocumentComposerProps> = ({
  narrativeText,
  onNarrativeChange,
  onSubmitStr,
}) => {
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--surface)] select-none">
      {/* Header bar */}
      <div className="h-9 px-4 bg-[var(--surface-sunk)] border-b border-[var(--border)] flex items-center justify-between text-[12px] shrink-0">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-[var(--accent)]" strokeWidth={1.5} />
          <span className="font-semibold text-[var(--ink)]">
            FIU-IND STR Form Validation Draft · Ref #STR-2026-IN-9081
          </span>
          <span className="px-1.5 py-0.2 text-[10px] font-mono bg-[var(--accent-soft)] text-[var(--accent)] rounded-[2px]">
            PMLA SEC-12 COMPLIANT
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => alert('Exported STR package in XML/PDF format for FIU FINnet gateway.')}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export FINnet XML
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmitStr}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Submit STR to Compliance
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-4 max-w-[850px] space-y-4">
        {/* Report Metadata Header */}
        <div className="p-3 bg-[var(--surface-sunk)] border border-[var(--border)] rounded-[4px] grid grid-cols-3 gap-3 text-[11px] font-mono">
          <div>
            <span className="text-[var(--ink-faint)] block uppercase text-[10px]">Reporting Entity</span>
            <span className="text-[var(--ink)] font-bold">HDFC Bank Ltd (RE-0012)</span>
          </div>
          <div>
            <span className="text-[var(--ink-faint)] block uppercase text-[10px]">Suspicion Ground</span>
            <span className="text-[var(--danger)] font-bold">Mule Account / Rapid Dispersal</span>
          </div>
          <div>
            <span className="text-[var(--ink-faint)] block uppercase text-[10px]">Lead Account</span>
            <span className="text-[var(--ink)] font-bold">HDFC-XXXX9416</span>
          </div>
        </div>

        {/* Narrative Section */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase text-[var(--ink-muted)] tracking-wider">
            Investigator Suspicion Narrative & Cited Evidence
          </label>
          <p className="text-[11px] text-[var(--ink-faint)]">
            Click 'Insert' on any source evidence or transaction row to embed verifiable citation tokens.
          </p>
          <textarea
            value={narrativeText}
            onChange={e => onNarrativeChange(e.target.value)}
            rows={14}
            className="w-full p-3 font-mono text-[12px] leading-relaxed bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] rounded-[4px] focus:outline-none focus:border-[var(--accent)] resize-none"
          />
        </div>

        {/* Regulatory Checklist */}
        <div className="p-3 bg-[var(--surface-sunk)] border border-[var(--border)] rounded-[4px] space-y-2 text-[11px]">
          <span className="font-semibold text-[var(--ink)] block uppercase text-[10px]">
            Pre-Submission Compliance Checklist
          </span>
          <div className="flex items-center gap-2 text-[var(--ink)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
            <span>Debit facility freeze requested under Section 12 PMLA 2002</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--ink)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
            <span>Direct counterparty nodes verified against NCRB cybercrime registry</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--ink)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
            <span>KYC re-verification triggered for beneficial owner identification</span>
          </div>
        </div>
      </div>
    </main>
  );
};
