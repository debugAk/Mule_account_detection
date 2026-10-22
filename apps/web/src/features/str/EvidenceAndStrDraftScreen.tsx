import React, { useState } from 'react';
import { SourceEvidenceList } from './SourceEvidenceList';
import { StrDocumentComposer } from './StrDocumentComposer';
import { UndoToast } from '@mule-platform/ui-kit';

export const EvidenceAndStrDraftScreen: React.FC = () => {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [narrativeText, setNarrativeText] = useState(
    `SUSPICIOUS TRANSACTION REPORT (STR) — SUMMARY OF INVESTIGATION\n\n` +
    `1. OPERATIONAL OVERVIEW:\n` +
    `Subject account HDFC-XXXX9416 was opened on 14-Aug-2026. Automated rule engine flagged rapid layering velocity: 99.1% of inward credits routed outward within 14 minutes.\n\n` +
    `2. OBSERVED EVIDENCE:\n` +
    `[EVID: 99.1% Pass-Through on HDFC-XXXX9416] resulted in ₹16,54,01,140 total turnover with ₹0 residual balance.\n` +
    `[EVID: Device Cluster DEV-F7B2-991A] was observed coordinating transfers across 9 parallel accounts.\n\n` +
    `3. REGULATORY RECOMMENDATION:\n` +
    `Immediate debit freeze confirmed under PMLA Section 12. Escalating STR to FIU-IND for further syndicate tracking.`
  );

  const handleAddEvidence = (citation: string) => {
    setNarrativeText(prev => `${prev}\n- Added Citation: ${citation}`);
    setToastMsg(`Citation added to STR Draft: ${citation}`);
  };

  const handleSubmitStr = () => {
    setToastMsg('STR Package #STR-2026-IN-9081 submitted to AML Principal Officer');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[var(--bg)] relative">
      {/* Left Column: Source Evidence List (360px) */}
      <SourceEvidenceList onAddEvidence={handleAddEvidence} />

      {/* Right Column: Document Composer */}
      <StrDocumentComposer
        narrativeText={narrativeText}
        onNarrativeChange={setNarrativeText}
        onSubmitStr={handleSubmitStr}
      />

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50">
          <UndoToast
            id={`str-toast-${Date.now()}`}
            message={toastMsg}
            onDismiss={() => setToastMsg(null)}
          />
        </div>
      )}
    </div>
  );
};
