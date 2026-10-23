import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Core } from 'cytoscape';
import { api } from '../../lib/api';
import { CytoscapeCanvas } from './CytoscapeCanvas';
import { GraphFollowTheMoneyControl } from './GraphFollowTheMoneyControl';
import { GraphTableViewFallback } from './GraphTableViewFallback';
import { MONEY_PATH_HOPS, GraphNodeData } from './graphData';
import { Button } from '@mule-platform/ui-kit';
import { Table, Network, Circle, Square, Diamond, Hexagon, X, ZoomIn, ZoomOut, Maximize2, Tag } from 'lucide-react';

export const LinkAnalysisGraphScreen: React.FC = () => {
  const [viewMode, setViewMode] = useState<'canvas' | 'table'>('canvas');
  const [layoutMode, setLayoutMode] = useState<'cose' | 'concentric' | 'breadthfirst'>('cose');
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [isTracing, setIsTracing] = useState(false);
  const [currentHopIndex, setCurrentHopIndex] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const cyInstanceRef = useRef<Core | null>(null);

  const { data: graphData } = useQuery({
    queryKey: ['network-graph'],
    queryFn: () => api.getNetworkGraph(),
  });

  const hops = graphData?.money_path_hops?.length ? graphData.money_path_hops : MONEY_PATH_HOPS;
  const activeHopEdgeId = isTracing ? hops[currentHopIndex] : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--surface-sunk)] relative select-none">
      {/* Top Controls Toolbar */}
      <div className="h-9 px-3 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between text-[11px] shrink-0 z-10 gap-3">
        {/* Color & Shape Legend */}
        <div className="flex items-center gap-3 overflow-x-auto text-[11px] text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink)] uppercase tracking-wider text-[10px]">Legend:</span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#F25C54]" /> Critical Mule (&gt;80)
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#E0A458]" /> High Risk (60-80)
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#5FB8A8]" /> Monitored Account
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Diamond className="w-3 h-3 text-[#D175B7]" /> Beneficiary
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Square className="w-3 h-3 text-[#6895D2]" /> Device
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Hexagon className="w-3 h-3 text-[#F3C623]" /> SIM
          </span>
        </div>

        {/* View & Layout Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {viewMode === 'canvas' && (
            <>
              {/* Layout Switcher */}
              <div className="flex items-center gap-1 font-mono">
                <span className="text-[10px] text-[var(--ink-muted)]">Layout:</span>
                <select
                  value={layoutMode}
                  onChange={e => setLayoutMode(e.target.value as any)}
                  className="bg-[var(--surface-sunk)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[11px] text-[var(--ink)] focus:outline-none"
                >
                  <option value="cose">Force Spread (COSE)</option>
                  <option value="concentric">Concentric Rings</option>
                  <option value="breadthfirst">Flow Tree</option>
                </select>
              </div>

              {/* Edge Label Visibility Toggle */}
              <button
                onClick={() => setShowAllLabels(!showAllLabels)}
                title={showAllLabels ? 'Hide edge amount labels (show on hover)' : 'Show all edge amount labels'}
                className={`px-2 py-0.5 text-[10px] font-mono border rounded flex items-center gap-1 transition-colors ${
                  showAllLabels
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] border-[var(--border)]'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>{showAllLabels ? 'Amounts: All' : 'Amounts: Hover'}</span>
              </button>

              {/* Zoom Buttons */}
              <div className="flex items-center border border-[var(--border)] rounded overflow-hidden">
                <button
                  onClick={() => cyInstanceRef.current?.zoom(cyInstanceRef.current.zoom() * 1.25)}
                  className="p-1 hover:bg-[var(--surface-sunk)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => cyInstanceRef.current?.zoom(cyInstanceRef.current.zoom() * 0.8)}
                  className="p-1 hover:bg-[var(--surface-sunk)] text-[var(--ink-muted)] hover:text-[var(--ink)] border-l border-[var(--border)]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => cyInstanceRef.current?.fit(undefined, 40)}
                  className="p-1 hover:bg-[var(--surface-sunk)] text-[var(--ink-muted)] hover:text-[var(--ink)] border-l border-[var(--border)]"
                  title="Fit View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {/* View Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === 'canvas' ? 'table' : 'canvas')}
            icon={viewMode === 'canvas' ? <Table className="w-3 h-3" /> : <Network className="w-3 h-3" />}
          >
            {viewMode === 'canvas' ? 'Table View' : 'Canvas Graph'}
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
              graphData={graphData}
              layoutMode={layoutMode}
              showAllLabels={showAllLabels}
              onCyReady={cy => {
                cyInstanceRef.current = cy;
              }}
            />
          </>
        ) : (
          <GraphTableViewFallback />
        )}

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute right-3 top-3 z-30 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-[6px] shadow-lg p-3 text-[12px] animate-in fade-in duration-100">
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
              <div className="text-[13px] font-bold text-[var(--ink)]">{selectedNode.label}</div>
              <div className="text-[11px] text-[var(--ink-muted)]">Type: {selectedNode.type.toUpperCase()}</div>
              {selectedNode.riskScore && (
                <div className={`text-[11px] font-bold ${selectedNode.riskScore >= 80 ? 'text-[#F25C54]' : selectedNode.riskScore >= 60 ? 'text-[#E0A458]' : 'text-[#5FB8A8]'}`}>
                  Mule Risk Score: {selectedNode.riskScore}/100
                </div>
              )}
              {selectedNode.subtext && (
                <div className="text-[11px] font-sans text-[var(--ink-muted)] pt-1">{selectedNode.subtext}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
