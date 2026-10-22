import React, { useState } from 'react';
import { CytoscapeCanvas } from './CytoscapeCanvas';
import { GraphFollowTheMoneyControl } from './GraphFollowTheMoneyControl';
import { GraphTableViewFallback } from './GraphTableViewFallback';
import { MONEY_PATH_HOPS, GraphNodeData } from './graphData';
import { Button } from '@mule-platform/ui-kit';
import { Table, Network, Circle, Square, Diamond, Hexagon, X } from 'lucide-react';

export const LinkAnalysisGraphScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas');
  const [isTracing, setIsTracing] = useState(false);
  const [currentHopIndex, setCurrentHopIndex] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);

  const activeHopEdgeId = isTracing ? MONEY_PATH_HOPS[currentHopIndex] : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--surface-sunk)] relative select-none">
      {/* Top Controls Toolbar */}
      <div className="h-9 px-3 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between text-[12px] shrink-0 z-10">
        {/* Shape Legend */}
        <div className="flex items-center gap-4 text-[11px] text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink)]">SHAPES:</span>
          <span className="flex items-center gap-1 font-mono">
            <Circle className="w-3.5 h-3.5 text-[var(--accent)]" /> Account
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Square className="w-3.5 h-3.5 text-[var(--secondary)]" /> Device
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Diamond className="w-3.5 h-3.5 text-[var(--danger)]" /> Beneficiary
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Hexagon className="w-3.5 h-3.5 text-[var(--warn)]" /> Phone / SIM
          </span>
        </div>

        {/* View mode toggle (Canvas vs Table View fallback) */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'canvas' ? 'table' : 'canvas')}
            icon={viewMode === 'canvas' ? <Table className="w-3.5 h-3.5" /> : <Network className="w-3.5 h-3.5" />}
          >
            {viewMode === 'canvas' ? 'Switch to Accessible Table View' : 'Switch to Canvas Graph'}
          </Button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'canvas' ? (
          <>
            <GraphFollowTheMoneyControl
              isTracing={isTracing}
              onToggleTracing={() => {
                setIsTracing(!isTracing);
                setCurrentHopIndex(0);
              }}
              currentHopIndex={currentHopIndex}
              onSetHopIndex={setCurrentHopIndex}
            />
            <CytoscapeCanvas
              activeHopEdgeId={activeHopEdgeId}
              onSelectNode={setSelectedNode}
            />
          </>
        ) : (
          <GraphTableViewFallback />
        )}

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute right-3 top-3 z-30 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] shadow-lg p-3 text-[12px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <span className="text-[10px] uppercase font-bold text-[var(--ink-faint)] tracking-wider">
                Node Inspector
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-0.5 hover:text-[var(--ink)] text-[var(--ink-muted)] rounded-[2px]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2 space-y-1.5 font-mono">
              <div className="text-[14px] font-bold text-[var(--ink)]">{selectedNode.label}</div>
              <div className="text-[11px] text-[var(--ink-muted)]">Type: {selectedNode.type.toUpperCase()}</div>
              {selectedNode.riskScore && (
                <div className="text-[11px] text-[var(--danger)]">Mule Score: {selectedNode.riskScore}</div>
              )}
              {selectedNode.subtext && (
                <div className="text-[11px] font-sans text-[var(--ink)] pt-1">{selectedNode.subtext}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
