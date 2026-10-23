import React, { useEffect, useRef } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { useTheme } from '../../hooks/useTheme';
import { SEED_GRAPH_ELEMENTS, GraphNodeData } from './graphData';
import { NetworkGraphResponse } from '@mule-platform/shared-types';
import { getCytoscapeStyles, getLayoutConfig } from './graphTheme';

interface CytoscapeCanvasProps {
  activeHopEdgeId: string | null;
  onSelectNode: (node: GraphNodeData | null) => void;
  graphData?: NetworkGraphResponse;
  layoutMode?: 'cose' | 'concentric' | 'breadthfirst';
  showAllLabels?: boolean;
  onCyReady?: (cy: Core) => void;
}

export const CytoscapeCanvas: React.FC<CytoscapeCanvasProps> = ({
  activeHopEdgeId,
  onSelectNode,
  graphData,
  layoutMode = 'cose',
  showAllLabels = false,
  onCyReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { theme } = useTheme();

  // Initialize Cytoscape once on mount or when data changes
  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = graphData?.nodes?.length ? graphData.nodes : SEED_GRAPH_ELEMENTS.nodes;
    const edges = graphData?.edges?.length ? graphData.edges : SEED_GRAPH_ELEMENTS.edges;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...nodes.map(n => ({ data: n.data })),
        ...edges.filter(e => e.data && e.data.source).map(e => ({ data: e.data })),
      ],
      style: getCytoscapeStyles(theme, showAllLabels),
      layout: getLayoutConfig(layoutMode),
      boxSelectionEnabled: false,
      minZoom: 0.2,
      maxZoom: 3.5,
    });

    cy.on('tap', 'node', e => {
      onSelectNode(e.target.data() as GraphNodeData);
    });

    cy.on('tap', e => {
      if (e.target === cy) onSelectNode(null);
    });

    cy.on('mouseover', 'node', e => {
      const node = e.target;
      const neighborhood = node.neighborhood().add(node);
      cy.elements().addClass('faded');
      neighborhood.removeClass('faded');
    });

    cy.on('mouseout', 'node', () => {
      cy.elements().removeClass('faded');
    });

    cy.on('dblclick', 'node', e => {
      cy.animate({ center: { eles: e.target }, zoom: 1.8 }, { duration: 220 });
    });

    cyRef.current = cy;
    if (onCyReady) onCyReady(cy);

    return () => {
      cy.destroy();
    };
  }, [graphData, onSelectNode]);

  // Update styles when theme or label visibility changes
  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.style(getCytoscapeStyles(theme, showAllLabels));
  }, [theme, showAllLabels]);

  // Re-run layout when layoutMode changes
  useEffect(() => {
    if (!cyRef.current) return;
    const layout = cyRef.current.layout(getLayoutConfig(layoutMode));
    layout.run();
  }, [layoutMode]);

  // Update active hop edge highlight
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.edges().removeClass('highlighted-hop');

    if (activeHopEdgeId) {
      const edge = cy.getElementById(activeHopEdgeId);
      if (edge.length > 0) {
        edge.addClass('highlighted-hop');
        cy.animate({ center: { eles: edge } }, { duration: 200 });
      }
    }
  }, [activeHopEdgeId]);

  return <div ref={containerRef} className="w-full h-full bg-[var(--surface-sunk)]" />;
};
