import React from 'react';
import { Button } from '@mule-platform/ui-kit';
import { Route, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { MONEY_PATH_HOPS } from './graphData';

interface FollowTheMoneyControlProps {
  currentHopIndex: number;
  onSetHopIndex: (index: number) => void;
  isTracing: boolean;
  onToggleTracing: () => void;
}

export const GraphFollowTheMoneyControl: React.FC<FollowTheMoneyControlProps> = ({
  currentHopIndex,
  onSetHopIndex,
  isTracing,
  onToggleTracing,
}) => {
  return (
    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] shadow-md select-none text-[12px]">
      <Button
        variant={isTracing ? 'danger' : 'primary'}
        size="sm"
        onClick={onToggleTracing}
        icon={<Route className="w-3.5 h-3.5" />}
      >
        {isTracing ? 'Stop Money Trace' : 'Follow the Money'}
      </Button>

      {isTracing && (
        <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--border)]">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentHopIndex <= 0}
            onClick={() => onSetHopIndex(Math.max(0, currentHopIndex - 1))}
            icon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Prev
          </Button>

          <span className="font-mono text-[11px] tabular-nums text-[var(--ink-muted)]">
            Hop <strong>{currentHopIndex + 1}</strong> of {MONEY_PATH_HOPS.length}
          </span>

          <Button
            variant="ghost"
            size="sm"
            disabled={currentHopIndex >= MONEY_PATH_HOPS.length - 1}
            onClick={() => onSetHopIndex(Math.min(MONEY_PATH_HOPS.length - 1, currentHopIndex + 1))}
            icon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Next
          </Button>

          <button
            onClick={() => onSetHopIndex(0)}
            className="p-1 text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors rounded-[2px]"
            title="Reset trace to first hop"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
