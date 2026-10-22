import React, { useEffect, useRef } from 'react';
import cytoscape, { Core } from 'cytoscape';
import { SEED_GRAPH_ELEMENTS, GraphNodeData } from './graphData';

interface CytoscapeCanvasProps {
  activeHopEdgeId: string | null;
  onSelectNode: (node: GraphNodeData | null) => void;
}

export const CytoscapeCanvas: React.FC<CytoscapeCanvasProps> = ({ activeHopEdgeId, onSelectNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...SEED_GRAPH_ELEMENTS.nodes.map(n => ({ data: n.data })),
        ...SEED_GRAPH_ELEMENTS.edges.filter(e => e.data && e.data.source).map(e => ({ data: e.data })),
      ],
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'font-family': 'Inter, system-ui, sans-serif',
            'font-size': '11px',
            'font-weight': 600,
            color: 'var(--ink)',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': 'var(--surface)',
            'border-width': 2,
            'border-color': 'var(--accent)',
            width: 32,
            height: 32,
            'transition-property': 'opacity, border-color, border-width',
            'transition-duration': 0.16,
          },
        },
        {
          selector: 'node[type="account"]',
          style: { shape: 'ellipse', 'border-color': 'var(--accent)', 'background-color': 'var(--surface)' },
        },
        {
          selector: 'node[type="device"]',
          style: { shape: 'round-rectangle', 'border-color': 'var(--secondary)', 'background-color': 'var(--surface)' },
        },
        {
          selector: 'node[type="beneficiary"]',
          style: { shape: 'diamond', 'border-color': 'var(--danger)', 'background-color': 'var(--surface)', width: 36, height: 36 },
        },
        {
          selector: 'node[type="phone"]',
          style: { shape: 'hexagon', 'border-color': 'var(--warn)', 'background-color': 'var(--surface)' },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': 'var(--border)',
            'target-arrow-color': 'var(--border)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '9px',
            'font-family': 'JetBrains Mono, monospace',
            color: 'var(--ink-muted)',
            'text-background-opacity': 1,
            'text-background-color': 'var(--surface)',
            'text-background-padding': '2px',
            'transition-property': 'line-color, width, opacity',
            'transition-duration': 0.2,
          },
        },
        {
          selector: 'edge:hover',
          style: {
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3],
            'line-color': 'var(--accent)',
            'target-arrow-color': 'var(--accent)',
            width: 3,
          },
        },
        {
          selector: '.highlighted-hop',
          style: {
            'line-color': 'var(--danger)',
            'target-arrow-color': 'var(--danger)',
            width: 4,
            'line-style': 'solid',
            'z-index': 99,
          },
        },
        {
          selector: '.faded',
          style: { opacity: 0.25 },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeDimensionsIncludeLabels: true,
      },
    });

    cy.on('tap', 'node', e => {
      onSelectNode(e.target.data() as GraphNodeData);
    });

    cy.on('tap', e => {
      if (e.target === cy) onSelectNode(null);
    });

    // Hover neighbor highlighting
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

    return () => {
      cy.destroy();
    };
  }, [onSelectNode]);

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
