import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { CsvIngestSummary } from '@mule-platform/shared-types';
import { X, UploadCloud, FileText, CheckCircle2, AlertTriangle, Download, RefreshCw } from 'lucide-react';

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (summary: CsvIngestSummary) => void;
}

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<CsvIngestSummary | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (uploadFile: File) => api.uploadCsv(uploadFile),
    onSuccess: (data) => {
      setSummary(data);
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['network-graph'] });
      if (onSuccess) onSuccess(data);
    },
  });

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setSummary(null);
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDownloadSample = async (type: 'transactions' | 'soa') => {
    const csvContent = await api.downloadSampleCsv(type);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sample_${type}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[6px] w-full max-w-2xl overflow-hidden shadow-xl animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-sunk)]">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-[13px] font-bold text-[var(--ink)]">Batch CSV Ingestion & Stream Analysis</h2>
          </div>
          <button onClick={onClose} className="text-[var(--ink-muted)] hover:text-[var(--ink)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Sample Download Bar */}
          <div className="flex items-center justify-between p-2.5 bg-[var(--surface-sunk)] border border-[var(--border)] rounded-[4px] text-[11px]">
            <span className="text-[var(--ink-muted)]">Download verified synthetic test schemas:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadSample('transactions')}
                className="px-2 py-1 text-[var(--ink)] hover:bg-[var(--surface)] border border-[var(--border)] rounded font-mono inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-[var(--accent)]" /> txns_sample.csv
              </button>
              <button
                onClick={() => handleDownloadSample('soa')}
                className="px-2 py-1 text-[var(--ink)] hover:bg-[var(--surface)] border border-[var(--border)] rounded font-mono inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-[var(--accent)]" /> soa_sample.csv
              </button>
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[4px] p-6 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] hover:border-[var(--accent)] bg-[var(--bg)]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setSummary(null);
                }
              }}
              accept=".csv"
              className="hidden"
            />
            <FileText className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
            <div className="text-[12px] font-semibold text-[var(--ink)]">
              {file ? file.name : 'Select or drag a transaction CSV file here'}
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] mt-1 font-mono">
              Supports standard transactions or SOA statements up to 50MB
            </p>
          </div>

          {/* Upload Button */}
          {file && !summary && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                Selected: {(file.size / 1024).toFixed(1)} KB
              </span>
              <button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="px-4 py-1.5 bg-[var(--accent)] text-white text-[12px] font-mono rounded-[4px] hover:bg-[var(--accent-hover)] transition-colors inline-flex items-center gap-1.5"
              >
                {uploadMutation.isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {uploadMutation.isPending ? 'Validating & Analyzing...' : 'Run Pipeline & Ingest'}
              </button>
            </div>
          )}

          {/* Results Summary */}
          {summary && (
            <div className="space-y-3 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center gap-2 text-[var(--success)] text-[12px] font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Ingestion Completed & Scored
              </div>

              <div className="grid grid-cols-4 gap-2 font-mono text-center">
                <div className="p-2 bg-[var(--surface-sunk)] border border-[var(--border)] rounded">
                  <div className="text-[10px] text-[var(--ink-muted)] uppercase">Accepted</div>
                  <div className="text-[14px] font-bold text-[var(--success)]">{summary.accepted_rows}</div>
                </div>
                <div className="p-2 bg-[var(--surface-sunk)] border border-[var(--border)] rounded">
                  <div className="text-[10px] text-[var(--ink-muted)] uppercase">Duplicates</div>
                  <div className="text-[14px] font-bold text-[var(--warn)]">{summary.duplicate_rows}</div>
                </div>
                <div className="p-2 bg-[var(--surface-sunk)] border border-[var(--border)] rounded">
                  <div className="text-[10px] text-[var(--ink-muted)] uppercase">Rejected</div>
                  <div className="text-[14px] font-bold text-[var(--danger)]">{summary.rejected_rows}</div>
                </div>
                <div className="p-2 bg-[var(--surface-sunk)] border border-[var(--border)] rounded">
                  <div className="text-[10px] text-[var(--ink-muted)] uppercase">New Alerts</div>
                  <div className="text-[14px] font-bold text-[var(--accent)]">{summary.created_alerts_count}</div>
                </div>
              </div>

              {summary.errors.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--danger)] mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Validation Exceptions ({summary.errors.length}):
                  </div>
                  <div className="max-h-24 overflow-y-auto bg-[var(--surface-sunk)] border border-[var(--border)] rounded p-2 text-[10px] font-mono space-y-1">
                    {summary.errors.map((err, i) => (
                      <div key={i} className="text-[var(--danger)]">
                        Row {err.row}: {err.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[var(--surface-sunk)] border-t border-[var(--border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 text-[11px] font-mono text-[var(--ink-muted)] hover:text-[var(--ink)] border border-[var(--border)] rounded-[4px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
