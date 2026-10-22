export interface GraphNodeData {
  id: string;
  label: string;
  type: 'account' | 'device' | 'beneficiary' | 'phone';
  riskScore?: number;
  subtext?: string;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  amountINR: number;
  txnCount: number;
  label: string;
}

export const SEED_GRAPH_ELEMENTS = {
  nodes: [
    { data: { id: 'ACC-1', label: 'HDFC-XXXX9416', type: 'account', riskScore: 89, subtext: 'Mule Lead Node' } },
    { data: { id: 'ACC-2', label: 'SBIN-XXXX9097', type: 'account', riskScore: 90, subtext: 'Layering Proxy' } },
    { data: { id: 'ACC-3', label: 'ICIC-XXXX8931', type: 'account', riskScore: 91, subtext: 'Cash-out Node' } },
    { data: { id: 'ACC-4', label: 'AXIS-XXXX4553', type: 'account', riskScore: 92, subtext: 'Dormant Mule' } },
    { data: { id: 'DEV-1', label: 'DEV-F7B2-991A', type: 'device', subtext: 'Shared Redmi Note 10' } },
    { data: { id: 'DEV-2', label: 'DEV-88CD-11FA', type: 'device', subtext: 'Emulator Cluster' } },
    { data: { id: 'BEN-1', label: 'Royal Trading Shell', type: 'beneficiary', subtext: 'Current Account' } },
    { data: { id: 'BEN-2', label: 'P2P Crypto Escrow', type: 'beneficiary', subtext: 'Off-Ramp Platform' } },
    { data: { id: 'PHN-1', label: '+91-98710XXXXX', type: 'phone', subtext: 'Virtual SIM Card' } },
    { data: { id: 'PHN-2', label: '+91-91220XXXXX', type: 'phone', subtext: 'Jamtara Telegram Ops' } },
  ],
  edges: [
    { data: { id: 'E1', source: 'ACC-1', target: 'ACC-2', amountINR: 16500000, txnCount: 42, label: '₹1.65 Cr' } },
    { data: { id: 'E2', source: 'ACC-2', target: 'ACC-3', amountINR: 12200000, txnCount: 28, label: '₹1.22 Cr' } },
    { data: { id: 'E3', source: 'ACC-3', target: 'BEN-1', amountINR: 8500000, txnCount: 14, label: '₹85 L' } },
    { data: { id: 'E4', source: 'ACC-2', target: 'BEN-2', amountINR: 6400000, txnCount: 19, label: '₹64 L' } },
    { data: { id: 'E5', source: 'DEV-1', target: 'ACC-1', amountINR: 0, txnCount: 0, label: 'Device Link' } },
    { data: { id: 'DEV-1', target: 'ACC-2', amountINR: 0, txnCount: 0, label: 'Device Link' }, data_source: 'DEV-1' },
    { data: { id: 'E7', source: 'DEV-2', target: 'ACC-3', amountINR: 0, txnCount: 0, label: 'Device Link' } },
    { data: { id: 'E8', source: 'PHN-1', target: 'ACC-1', amountINR: 0, txnCount: 0, label: 'UPI Linked' } },
    { data: { id: 'E9', source: 'PHN-2', target: 'ACC-2', amountINR: 0, txnCount: 0, label: 'Telegram SMS OTP' } },
    { data: { id: 'E10', source: 'ACC-1', target: 'ACC-4', amountINR: 4200000, txnCount: 9, label: '₹42 L' } },
  ],
};

export const MONEY_PATH_HOPS = ['E1', 'E2', 'E3', 'E4'];
