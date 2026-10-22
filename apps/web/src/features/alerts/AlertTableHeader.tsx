import React from 'react';

interface AlertTableHeaderProps {
  allSelected: boolean;
  onToggleSelectAll: () => void;
  totalVisible: number;
}

export const AlertTableHeader: React.FC<AlertTableHeaderProps> = ({
  allSelected,
  onToggleSelectAll,
  totalVisible,
}) => {
  return (
    <div
      role="row"
      className="flex items-center h-[32px] px-3 bg-[var(--surface-sunk)] border-b border-[var(--border)] text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider select-none shrink-0"
    >
      <div className="w-[36px] shrink-0 flex items-center">
        <input
          type="checkbox"
          checked={allSelected && totalVisible > 0}
          onChange={onToggleSelectAll}
          aria-label="Select all alerts in this view"
          className="w-3.5 h-3.5 rounded-[2px] border-[var(--border)] text-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] accent-[var(--accent)] cursor-pointer"
        />
      </div>

      <div className="w-[84px] shrink-0 pr-3 text-right">Risk Score</div>
      <div className="w-[150px] shrink-0">Account ID</div>
      <div className="w-[140px] shrink-0">Entity / Bank</div>
      <div className="w-[80px] shrink-0 text-right pr-3">Pass-Thru</div>
      <div className="w-[64px] shrink-0 text-right pr-3">Degree</div>
      <div className="w-[54px] shrink-0 text-right pr-3">Age</div>
      <div className="w-[110px] shrink-0 text-right pr-3">At Risk (INR)</div>
      <div className="w-[80px] shrink-0">Tier</div>
      <div className="w-[84px] shrink-0 text-right">Triggered</div>
    </div>
  );
};
