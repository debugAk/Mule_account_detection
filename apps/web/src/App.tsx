import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './hooks/useTheme';
import { Header } from './components/Header';
import { CsvUploadModal } from './components/CsvUploadModal';
import { DashboardScreen } from './features/dashboard/DashboardScreen';
import { AlertQueueScreen } from './features/alerts/AlertQueueScreen';
import { CaseDetailScreen } from './features/cases/CaseDetailScreen';
import { LinkAnalysisGraphScreen } from './features/graph/LinkAnalysisGraphScreen';
import { EvidenceAndStrDraftScreen } from './features/str/EvidenceAndStrDraftScreen';
import { Alert } from '@mule-platform/shared-types';
import { LayoutDashboard, Layers, FileSpreadsheet, Share2, FileCheck } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type AppTab = 'dashboard' | 'alerts' | 'case_detail' | 'graph' | 'str_draft';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(new Date().toISOString());
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleSelectAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setActiveTab('case_detail');
  };

  const handleOpenCaseFromDashboard = (caseId: string, alertId?: string) => {
    if (alertId) {
      setSelectedAlert({
        id: alertId,
        accountId: caseId,
        accountHolderMasked: 'Masked Entity',
        bankName: 'HDFC Bank',
        ifsc: 'HDFC0001042',
        upiHandleMasked: 'target@okhdfcbank',
        riskScore: 88,
        riskTier: 'CRITICAL',
        passThroughRatio: 0.98,
        graphDegree: 14,
        accountAgeDays: 18,
        amountAtRiskINR: 15400000,
        timestamp: new Date().toISOString(),
        status: 'INVESTIGATING',
        queueCategory: 'HIGH_RISK',
        signals: [
          'High Velocity Pass-Through (>95% routed within 15 mins)',
          'Sudden spike in high-turnover UPI credit tranches',
          'Shared hardware fingerprint with flagged syndicate cluster',
        ],
      } as unknown as Alert);
    }
    setActiveTab('case_detail');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg)] text-[var(--ink)] overflow-hidden">
      {/* Top chrome header */}
      <Header
        lastSynced={lastSyncedTime}
        onRefresh={() => queryClient.invalidateQueries()}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Navigation sub-bar */}
      <nav
        aria-label="Investigator module navigation"
        className="h-8 px-3 bg-[var(--surface-sunk)] border-b border-[var(--border)] flex items-center justify-between text-[12px] font-medium shrink-0 select-none"
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-2xs border border-[var(--border)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={1.5} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] transition-colors ${
              activeTab === 'alerts'
                ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-2xs border border-[var(--border)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={1.5} />
            <span>Alert Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('case_detail')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] transition-colors ${
              activeTab === 'case_detail'
                ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-2xs border border-[var(--border)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[var(--secondary)]" strokeWidth={1.5} />
            <span>Case Detail {selectedAlert ? `(${selectedAlert.id})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] transition-colors ${
              activeTab === 'graph'
                ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-2xs border border-[var(--border)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={1.5} />
            <span>Link Analysis Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('str_draft')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] transition-colors ${
              activeTab === 'str_draft'
                ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-2xs border border-[var(--border)]'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-[var(--success)]" strokeWidth={1.5} />
            <span>Evidence & STR Draft</span>
          </button>
        </div>

        {/* Keyboard Quick Navigation Hint */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-faint)]">
          <span>J/K: Navigate</span>
          <span>·</span>
          <span>X: Select</span>
          <span>·</span>
          <span>Enter: Open</span>
          <span>·</span>
          <span>/: Search</span>
        </div>
      </nav>

      {/* Main Screen Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'dashboard' && (
          <DashboardScreen
            onOpenCase={handleOpenCaseFromDashboard}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertQueueScreen
            onSelectAlertForDetail={handleSelectAlert}
            onLastSyncedUpdate={setLastSyncedTime}
          />
        )}

        {activeTab === 'case_detail' && (
          <CaseDetailScreen
            alert={selectedAlert}
            onBackToQueue={() => setActiveTab('alerts')}
          />
        )}

        {activeTab === 'graph' && <LinkAnalysisGraphScreen />}

        {activeTab === 'str_draft' && <EvidenceAndStrDraftScreen />}
      </div>

      {/* CSV Ingestion Modal */}
      <CsvUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
