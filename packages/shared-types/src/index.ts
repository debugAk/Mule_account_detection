export type RiskTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AlertStatus = 'NEW' | 'INVESTIGATING' | 'ESCALATED' | 'DISMISSED' | 'FROZEN';

export type QueueFilter = 'MY_QUEUE' | 'HIGH_RISK' | 'RINGS' | 'NEW_TODAY' | 'ALL';

export interface Alert {
  id: string;
  accountId: string;
  accountHolderMasked: string;
  bankName: string;
  ifsc: string;
  upiHandleMasked: string;
  riskScore: number;
  riskTier: RiskTier;
  passThroughRatio: number;
  graphDegree: number;
  accountAgeDays: number;
  amountAtRiskINR: number;
  timestamp: string;
  ringId?: string;
  status: AlertStatus;
  queueCategory: 'MY_QUEUE' | 'HIGH_RISK' | 'RINGS' | 'NEW_TODAY';
  signals: [string, string, string];
  assignedTo?: string;
  isRestricted?: boolean;
}

export interface Case {
  id: string;
  alertId: string;
  title: string;
  riskScore: number;
  primaryAccount: string;
  primaryHolderMasked: string;
  bankName: string;
  ifsc: string;
  slaDeadline: string | null;
  status: 'OPEN' | 'UNDER_REVIEW' | 'STR_SUBMITTED' | 'CLOSED';
  assignedAnalyst: string;
  totalExposedINR: number;
  summary: string;
  createdAt: string;
  notes?: CaseNote[];
}

export interface CaseNote {
  id: string;
  author: string;
  content: string;
  tag?: string;
  createdAt: string;
}

export interface FraudRing {
  id: string;
  name: string;
  accountCount: number;
  totalExposedINR: number;
  leadAccountMasked: string;
  deviceFingerprint: string;
  firstDetected: string;
  patternType: 'RAPID_DISPERSAL' | 'CIRCULAR_ROUTING' | 'DEVICE_FARM';
}

export interface TriagePayload {
  action: 'FREEZE' | 'ESCALATE' | 'DISMISS' | 'ASSIGN';
  alertIds: string[];
  reason?: string;
  analystId: string;
}

export interface TriageResponse {
  success: boolean;
  affectedCount: number;
  actionId: string;
  timestamp: string;
}

export interface PiiRevealRequest {
  accountId: string;
  field: 'full_account' | 'full_name' | 'phone';
  scopeReason: string;
}

export interface PiiRevealResponse {
  revealedValue: string;
  auditId: string;
  expiresAt?: string;
  expiresInSeconds?: number;
}

export interface AlertsResponse {
  items: Alert[];
  total: number;
  counts: {
    myQueue: number;
    highRisk: number;
    rings: number;
    newToday: number;
    all: number;
  };
  lastSynced: string;
}

export interface DashboardSummaryResponse {
  metrics: {
    totalTransactionsAnalyzed: number;
    totalAccounts: number;
    openInvestigations: number;
    flaggedTransactionValueINR: number;
    alertsSummary: {
      total: number;
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  riskDistribution: Array<{
    tier: string;
    count: number;
    color: string;
  }>;
  transactionTrends: Array<{
    date: string;
    count: number;
    volumeINR: number;
  }>;
  recentAlerts: Alert[];
  timestamp: string;
}

export interface CsvIngestSummary {
  import_id: string;
  filename: string;
  format_detected: string;
  total_rows: number;
  accepted_rows: number;
  rejected_rows: number;
  duplicate_rows: number;
  created_alerts_count: number;
  analyzed_accounts_count: number;
  errors: Array<{ row: number; reason: string }>;
  timestamp: string;
}

export interface NetworkGraphResponse {
  nodes: Array<{
    data: {
      id: string;
      label: string;
      type: 'account' | 'device' | 'beneficiary' | 'phone';
      riskScore?: number;
      subtext?: string;
      degree?: number;
      inDegree?: number;
      outDegree?: number;
    };
  }>;
  edges: Array<{
    data: {
      id: string;
      source: string;
      target: string;
      amountINR: number;
      txnCount: number;
      label: string;
      channel?: string;
      isObserved?: boolean;
    };
  }>;
  total_nodes: number;
  total_edges: number;
  high_degree_accounts: Array<{
    account: string;
    degree: number;
    riskScore: number;
  }>;
  money_path_hops: string[];
}
