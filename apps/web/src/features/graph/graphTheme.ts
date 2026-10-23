import { getThemePalette } from './graphColors';

export const getCytoscapeStyles = (theme: 'daylight' | 'night', showAllLabels: boolean): any[] => {
  const c = getThemePalette(theme);

  return [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-size': '10px',
        'font-weight': 600,
        color: c.text,
        'text-valign': 'bottom',
        'text-margin-y': 6,
        'background-color': c.accountBg,
        'border-width': 2,
        'border-color': c.accountBorder,
        width: 34,
        height: 34,
        'text-background-opacity': 0,
        'transition-property': 'opacity, border-color, border-width, width, height',
        'transition-duration': 0.16,
      },
    },
    {
      selector: 'node[type="account"]',
      style: { shape: 'ellipse', 'border-color': c.accountBorder, 'background-color': c.accountBg },
    },
    {
      selector: 'node[riskScore >= 60]',
      style: { 'border-color': c.warnBorder, 'background-color': c.warnBg, 'border-width': 2.5 },
    },
    {
      selector: 'node[riskScore >= 80]',
      style: { 'border-color': c.criticalBorder, 'background-color': c.criticalBg, 'border-width': 3, width: 38, height: 38 },
    },
    {
      selector: 'node[type="device"]',
      style: { shape: 'round-rectangle', 'border-color': c.deviceBorder, 'background-color': c.deviceBg, width: 32, height: 32 },
    },
    {
      selector: 'node[type="beneficiary"]',
      style: { shape: 'diamond', 'border-color': c.beneficiaryBorder, 'background-color': c.beneficiaryBg, width: 42, height: 42, 'border-width': 3 },
    },
    {
      selector: 'node[type="phone"]',
      style: { shape: 'hexagon', 'border-color': c.phoneBorder, 'background-color': c.phoneBg, width: 32, height: 32 },
    },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': c.edge,
        'target-arrow-color': c.edgeArrow,
        'target-arrow-shape': 'triangle',
        'arrow-scale': 0.8,
        'curve-style': 'bezier',
        label: showAllLabels ? 'data(label)' : '',
        'font-size': '9px',
        'font-family': 'JetBrains Mono, monospace',
        color: c.edgeLabelText,
        'text-background-opacity': showAllLabels ? 0.9 : 0,
        'text-background-color': c.edgeLabelBg,
        'text-background-padding': '2px',
        'text-rotation': 'autorotate',
      },
    },
    {
      selector: 'edge:hover, edge:selected',
      style: {
        width: 3,
        'line-color': c.edgeHover,
        'target-arrow-color': c.edgeHover,
        label: 'data(label)',
        color: c.edgeLabelText,
        'text-background-opacity': 0.95,
        'text-background-color': c.edgeLabelBg,
        'text-background-padding': '3px',
        'z-index': 90,
      },
    },
    {
      selector: '.highlighted-hop',
      style: {
        width: 4,
        'line-color': c.edgeHop,
        'target-arrow-color': c.edgeHop,
        label: 'data(label)',
        color: '#FFFFFF',
        'text-background-opacity': 1,
        'text-background-color': c.edgeHop,
        'text-background-padding': '3px',
        'z-index': 100,
      },
    },
    {
      selector: '.faded',
      style: { opacity: 0.15 },
    },
  ];
};

export const getLayoutConfig = (name: 'cose' | 'concentric' | 'breadthfirst') => {
  if (name === 'concentric') {
    return {
      name: 'concentric',
      animate: false,
      fit: true,
      padding: 50,
      spacingFactor: 1.6,
      minNodeSpacing: 50,
      concentric: (node: any) => {
        const d = node.data();
        if (d.type === 'beneficiary') return 10;
        if ((d.riskScore || 0) >= 80) return 8;
        if ((d.degree || 0) >= 5) return 6;
        return 2;
      },
      levelWidth: () => 2,
    };
  }

  if (name === 'breadthfirst') {
    return {
      name: 'breadthfirst',
      animate: false,
      fit: true,
      padding: 50,
      directed: true,
      spacingFactor: 1.5,
    };
  }

  return {
    name: 'cose',
    animate: false,
    fit: true,
    padding: 60,
    idealEdgeLength: 140,
    nodeOverlap: 80,
    refresh: 20,
    randomize: false,
    componentSpacing: 180,
    nodeRepulsion: 1500000,
    edgeElasticity: 45,
    nestingFactor: 1.2,
    gravity: 0.04,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
  };
};
