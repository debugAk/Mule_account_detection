import React from 'react';
import { QueueFilter } from '@mule-platform/shared-types';
import { Inbox, AlertTriangle, Network, Clock, ListFilter, AlertCircle, WifiOff } from 'lucide-react';
import { cn } from '@mule-platform/ui-kit';

interface FilterCounts {
  myQueue: number;
  highRisk: number;
  rings: number;
  newToday: number;
  all: number;
}

interface AlertFiltersRailProps {
  activeCategory: QueueFilter;
  onSelectCategory: (category: QueueFilter) => void;
  counts: FilterCounts;
  isSimulatedError: boolean;
  onToggleSimulateError: () => void;
  isOfflineMode: boolean;
  onToggleOffline: () => void;
}

export const AlertFiltersRail: React.FC<AlertFiltersRailProps> = ({
  activeCategory,
  onSelectCategory,
  counts,
  isSimulatedError,
  onToggleSimulateError,
  isOfflineMode,
  onToggleOffline,
}) => {
  const filterItems = [
    {
      id: 'MY_QUEUE' as QueueFilter,
      label: 'My queue',
      icon: <Inbox className="w-4 h-4 shrink-0" strokeWidth={1.5} />,
      count: counts.myQueue,
    },
    {
      id: 'HIGH_RISK' as QueueFilter,
      label: 'High risk (>= 75)',
      icon: <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--warn)]" strokeWidth={1.5} />,
      count: counts.highRisk,
    },
    {
      id: 'RINGS' as QueueFilter,
      label: 'Syndicate rings',
      icon: <Network className="w-4 h-4 shrink-0 text-[var(--accent)]" strokeWidth={1.5} />,
      count: counts.rings,
    },
    {
      id: 'NEW_TODAY' as QueueFilter,
      label: 'New today',
      icon: <Clock className="w-4 h-4 shrink-0" strokeWidth={1.5} />,
      count: counts.newToday,
    },
    {
      id: 'ALL' as QueueFilter,
      label: 'All alerts',
      icon: <ListFilter className="w-4 h-4 shrink-0" strokeWidth={1.5} />,
      count: counts.all,
    },
  ];

  return (
    <aside className="w-[230px] shrink-0 bg-[var(--surface-sunk)] border-r border-[var(--border)] flex flex-col justify-between p-2 select-none">
      <div>
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          Saved Filters
        </div>
        <nav className="flex flex-col gap-1 mt-1" aria-label="Alert queue filters">
          {filterItems.map(item => {
            const isActive = activeCategory === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectCategory(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors duration-[120ms] text-left',
                  isActive
                    ? 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--border)] shadow-xs font-semibold'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/60 border border-transparent'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>
                <span
                  className={cn(
                    'text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-full border shrink-0 ml-1',
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30'
                      : 'bg-[var(--surface)] text-[var(--ink-faint)] border-[var(--border)]'
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* State simulation testbed */}
      <div className="p-2 border-t border-[var(--border)] flex flex-col gap-1.5 text-[11px] text-[var(--ink-muted)]">
        <span className="text-[10px] uppercase font-semibold text-[var(--ink-faint)] tracking-wider">
          State Inspector
        </span>
        <button
          onClick={onToggleSimulateError}
          className={cn(
            'flex items-center justify-between px-2 py-1.5 rounded-[4px] border transition-colors text-left text-[11px]',
            isSimulatedError
              ? 'bg-[var(--danger)]/15 border-[var(--danger)] text-[var(--danger)] font-medium'
              : 'border-[var(--border)] hover:bg-[var(--surface)]'
          )}
        >
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span>Simulate 504 Error</span>
          </span>
          <span className="font-mono text-[10px] font-bold shrink-0">{isSimulatedError ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={onToggleOffline}
          className={cn(
            'flex items-center justify-between px-2 py-1.5 rounded-[4px] border transition-colors text-left text-[11px]',
            isOfflineMode
              ? 'bg-[var(--warn)]/15 border-[var(--warn)] text-[var(--warn)] font-medium'
              : 'border-[var(--border)] hover:bg-[var(--surface)]'
          )}
        >
          <span className="flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span>Simulate Reconnecting</span>
          </span>
          <span className="font-mono text-[10px] font-bold shrink-0">{isOfflineMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </aside>
  );
};
