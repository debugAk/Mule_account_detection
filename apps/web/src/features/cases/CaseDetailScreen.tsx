import React, { useState } from 'react';
import { Alert } from '@mule-platform/shared-types';
import { CaseEntitySummaryPane } from './CaseEntitySummaryPane';
import { CaseWorkAreaPane } from './CaseWorkAreaPane';
import { CaseActivityNotesPane } from './CaseActivityNotesPane';
import { DraggableDivider } from './DraggableDivider';
import { UndoToast } from '@mule-platform/ui-kit';

interface CaseDetailScreenProps {
  alert: Alert | null;
  onBackToQueue: () => void;
}

export const CaseDetailScreen: React.FC<CaseDetailScreenProps> = ({ alert, onBackToQueue }) => {
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(320);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!alert) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--surface)] text-[13px] text-[var(--ink-muted)]">
        <p>No alert selected for detailed case inspection.</p>
        <button
          onClick={onBackToQueue}
          className="mt-3 text-[12px] font-medium text-[var(--accent)] underline underline-offset-2"
        >
          Return to Alert Queue
        </button>
      </div>
    );
  }

  const handleLeftDrag = (delta: number) => {
    setLeftWidth(prev => Math.max(220, Math.min(420, prev + delta)));
  };

  const handleRightDrag = (delta: number) => {
    setRightWidth(prev => Math.max(240, Math.min(480, prev - delta)));
  };

  const handleAddToDraft = (item: string) => {
    setToastMsg(`Cited in STR draft: ${item.slice(0, 48)}...`);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[var(--bg)] relative">
      {/* Left Pane: Entity Summary (280px default) */}
      <CaseEntitySummaryPane alert={alert} width={leftWidth} />

      {/* Draggable Divider 1 */}
      <DraggableDivider onDrag={handleLeftDrag} />

      {/* Center Pane: Tabbed Work Area (flex-1) */}
      <CaseWorkAreaPane alert={alert} onAddToDraft={handleAddToDraft} />

      {/* Draggable Divider 2 */}
      {!isRightCollapsed && <DraggableDivider onDrag={handleRightDrag} />}

      {/* Right Pane: Activity & Notes (320px default, collapsible) */}
      <CaseActivityNotesPane
        alert={alert}
        width={rightWidth}
        isCollapsed={isRightCollapsed}
        onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
        onActionComplete={msg => setToastMsg(msg)}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50">
          <UndoToast
            id={`case-toast-${Date.now()}`}
            message={toastMsg}
            onDismiss={() => setToastMsg(null)}
          />
        </div>
      )}
    </div>
  );
};
