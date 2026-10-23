import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Alert } from '@mule-platform/shared-types';
import { Button } from '@mule-platform/ui-kit';
import { ShieldBan, Send, RefreshCw, ChevronRight, ChevronLeft, Plus, Clock } from 'lucide-react';

interface CaseActivityNotesPaneProps {
  alert: Alert;
  width: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onActionComplete: (msg: string) => void;
}

export const CaseActivityNotesPane: React.FC<CaseActivityNotesPaneProps> = ({
  alert,
  width,
  isCollapsed,
  onToggleCollapse,
  onActionComplete,
}) => {
  const caseId = (alert as any).caseId || `CASE-${alert.id}`;
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');

  const { data: dbNotes } = useQuery({
    queryKey: ['case-notes', caseId],
    queryFn: () => api.getCaseNotes(caseId),
  });

  const addNoteMutation = useMutation({
    mutationFn: (text: string) => api.addCaseNote(caseId, text, 'ANALYST-104'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-notes', caseId] });
      setNewNote('');
      onActionComplete('Analyst note saved to case file');
    },
  });

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote.trim());
  };

  const notesList = dbNotes && dbNotes.length > 0 ? dbNotes : [
    {
      id: '1',
      createdAt: '14:28 IST',
      content: 'Triggered by automated core engine: high pass-through observed.',
      author: 'Core Rule Engine',
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-[32px] bg-[var(--surface-sunk)] border-l border-[var(--border)] flex flex-col items-center py-3 select-none">
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:text-[var(--ink)] text-[var(--ink-muted)] hover:bg-[var(--surface)] rounded-[3px] transition-colors"
          title="Expand Activity & Notes pane"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="[writing-mode:vertical-lr] text-[11px] font-semibold text-[var(--ink-faint)] tracking-wider mt-4">
          ACTIVITY & TRIAGE
        </span>
      </div>
    );
  }

  return (
    <aside
      style={{ width }}
      className="bg-[var(--surface-sunk)] border-l border-[var(--border)] flex flex-col h-full overflow-y-auto p-3 text-[12px] select-none shrink-0"
    >
      {/* Pane Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
          Activity & Triage Actions
        </span>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:text-[var(--ink)] text-[var(--ink-muted)] hover:bg-[var(--surface)] rounded-[3px] transition-colors"
          title="Collapse pane"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 space-y-2">
        <Button
          variant="danger"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => onActionComplete(`Debit facility frozen for ${alert.accountId}`)}
          icon={<ShieldBan className="w-3.5 h-3.5" />}
        >
          Immediate Debit Freeze
        </Button>

        <Button
          variant="primary"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => onActionComplete(`Escalated ${alert.accountId} to FIU-IND STR queue`)}
          icon={<Send className="w-3.5 h-3.5" />}
        >
          Escalate to STR / FIU-IND
        </Button>

        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => onActionComplete(`Re-KYC verification ticket dispatched for ${alert.accountId}`)}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Request KYC Refresh
        </Button>
      </div>

      {/* Audit Log Timeline */}
      <div className="mt-4 flex-1 flex flex-col min-h-[200px]">
        <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
          <span className="text-[10px] uppercase font-semibold text-[var(--ink-faint)] tracking-wider">
            Case Timeline & Notes
          </span>
          <Clock className="w-3 h-3 text-[var(--ink-faint)]" />
        </div>

        <div className="mt-2 space-y-2 flex-1 overflow-y-auto">
          {notesList.map((n: any) => (
            <div key={n.id} className="p-2 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-faint)]">
                <span>{n.author}</span>
                <span>{n.created_at?.slice(11, 16) || n.time || 'Today'}</span>
              </div>
              <p className="text-[11px] text-[var(--ink)] leading-snug">{n.note_text || n.text}</p>
            </div>
          ))}
        </div>

        {/* Note Composer */}
        <form onSubmit={handleAddNote} className="mt-3 pt-2 border-t border-[var(--border)]">
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Log investigation note..."
            className="w-full h-16 p-2 bg-[var(--surface)] border border-[var(--border)] rounded-[4px] text-[11px] text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-[var(--accent)] resize-none"
          />
          <div className="mt-1 flex justify-end">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={addNoteMutation.isPending}
              icon={<Plus className="w-3 h-3" />}
            >
              Add Note
            </Button>
          </div>
        </form>
      </div>
    </aside>
  );
};
