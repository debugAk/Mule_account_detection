import {
  AlertsResponse,
  Case,
  CaseNote,
  FraudRing,
  PiiRevealRequest,
  PiiRevealResponse,
  QueueFilter,
  RiskTier,
  TriagePayload,
  TriageResponse,
  DashboardSummaryResponse,
  CsvIngestSummary,
  NetworkGraphResponse,
} from '@mule-platform/shared-types';

export interface FetchAlertsParams {
  category?: QueueFilter;
  search?: string;
  riskTier?: RiskTier | 'ALL';
  simulateError?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public technicalDetails?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': 'investigator',
      'X-User-ID': 'ANALYST-104',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorData: { message?: string; detail?: string; code?: string } | null = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON error body
    }

    const message = errorData?.detail || errorData?.message || `Request failed with HTTP status ${response.status}`;
    const tech = errorData ? JSON.stringify(errorData, null, 2) : `HTTP ${response.status} ${response.statusText}`;
    throw new ApiError(response.status, message, tech);
  }

  return response.json();
}

export const api = {
  getDashboardSummary: async (): Promise<DashboardSummaryResponse> => {
    return request<DashboardSummaryResponse>('/api/dashboard/summary');
  },

  getAlerts: async (params?: FetchAlertsParams): Promise<AlertsResponse> => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') {
      query.set('category', params.category);
    }
    if (params?.search) {
      query.set('q', params.search);
    }
    if (params?.riskTier && params.riskTier !== 'ALL') {
      query.set('riskTier', params.riskTier);
    }
    if (params?.simulateError) {
      query.set('error', 'true');
    }

    const qs = query.toString();
    const endpoint = `/api/alerts${qs ? `?${qs}` : ''}`;
    return request<AlertsResponse>(endpoint);
  },

  triageAlerts: async (payload: TriagePayload): Promise<TriageResponse> => {
    return request<TriageResponse>('/api/alerts/triage', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  undoTriage: async (alertIds: string[]): Promise<{ success: boolean; restoredCount: number }> => {
    return request<{ success: boolean; restoredCount: number }>('/api/alerts/triage/undo', {
      method: 'POST',
      body: JSON.stringify({ alertIds }),
    });
  },

  getCases: async (): Promise<{ items: Case[]; total: number }> => {
    return request<{ items: Case[]; total: number }>('/api/cases');
  },

  getCaseById: async (id: string): Promise<Case> => {
    return request<Case>(`/api/cases/${encodeURIComponent(id)}`);
  },

  getCaseNotes: async (caseId: string): Promise<CaseNote[]> => {
    return request<CaseNote[]>(`/api/cases/${encodeURIComponent(caseId)}/notes`);
  },

  addCaseNote: async (caseId: string, content: string, tag?: string): Promise<CaseNote> => {
    return request<CaseNote>(`/api/cases/${encodeURIComponent(caseId)}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content, tag, author: 'ANALYST-104' }),
    });
  },

  updateCaseStatus: async (caseId: string, status: string, reason?: string): Promise<{ success: boolean; newStatus: string }> => {
    return request<{ success: boolean; newStatus: string }>(`/api/cases/${encodeURIComponent(caseId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  getStrDraft: async (caseId: string): Promise<{ caseId: string; reference: string; narrative: string; isSubmitted: boolean }> => {
    return request<{ caseId: string; reference: string; narrative: string; isSubmitted: boolean }>(`/api/cases/${encodeURIComponent(caseId)}/str-draft`);
  },

  getFraudRings: async (): Promise<{ items: FraudRing[]; total: number }> => {
    return request<{ items: FraudRing[]; total: number }>('/api/rings');
  },

  getAccountTransactions: async (accountId: string): Promise<Array<any>> => {
    return request<Array<any>>(`/api/accounts/${encodeURIComponent(accountId)}/transactions`);
  },

  getAccount: async (accountId: string): Promise<any> => {
    return request<any>(`/api/accounts/${encodeURIComponent(accountId)}`);
  },

  requestPiiReveal: async (req: PiiRevealRequest): Promise<PiiRevealResponse> => {
    return request<PiiRevealResponse>('/api/audit/pii-reveal', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  getNetworkGraph: async (accountId?: string, minAmount?: number): Promise<NetworkGraphResponse> => {
    const query = new URLSearchParams();
    if (accountId) query.set('account_id', accountId);
    if (minAmount) query.set('min_amount', String(minAmount));
    const qs = query.toString();
    return request<NetworkGraphResponse>(`/api/graph/network${qs ? `?${qs}` : ''}`);
  },

  uploadCsv: async (file: File, importedBy: string = 'ANALYST-104'): Promise<CsvIngestSummary> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('imported_by', importedBy);

    const url = `${API_BASE}/api/ingest/csv`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-User-Role': 'investigator',
        'X-User-ID': importedBy,
      },
      body: formData,
    });

    if (!response.ok) {
      let err;
      try {
        err = await response.json();
      } catch {
        // pass
      }
      throw new ApiError(response.status, err?.detail || 'CSV ingestion failed');
    }

    return response.json();
  },

  downloadSampleCsvUrl: (type: 'transactions' | 'soa'): string => {
    return `${API_BASE}/api/ingest/sample/${type}`;
  },

  downloadSampleCsv: async (type: 'transactions' | 'soa'): Promise<string> => {
    const res = await fetch(`${API_BASE}/api/ingest/sample/${type}`);
    if (!res.ok) throw new ApiError(res.status, 'Failed to download sample CSV');
    return res.text();
  },
};
