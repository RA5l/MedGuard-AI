import { useState, useEffect } from 'react';
import { STATUS_CONFIG } from '../lib/badges';
import { caseService } from '../features/cases/services/caseService';
import type { CaseStatus } from '../features/cases/types/index';

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: 'pending',     label: 'Pending'     },
  { value: 'processing',  label: 'Processing'  },
  { value: 'ai_complete', label: 'AI Complete' },
  { value: 'reviewed',    label: 'Reviewed'    },
  { value: 'reported',    label: 'Reported'    },
  { value: 'archived',    label: 'Archived'    },
];

interface StatusQuickEditProps {
  caseId: string;
  status: CaseStatus;
  canEdit: boolean;
  onChanged?: (newStatus: CaseStatus) => void;
  className?: string;
}

/**
 * Status badge that becomes a clickable dropdown when canEdit is true —
 * one click reveals all status options (native <select>, styled to look
 * like the existing badge), no separate edit mode needed. Updates
 * optimistically and reverts + surfaces the error via title= on failure.
 */
export default function StatusQuickEdit({ caseId, status, canEdit, onChanged, className = '' }: StatusQuickEditProps) {
  const [localStatus, setLocalStatus] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setLocalStatus(status); }, [status]);

  const cfg = STATUS_CONFIG[localStatus];

  if (!canEdit) {
    return cfg ? (
      <span className={`text-xs px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${cfg.classes} ${className}`}>
        {cfg.label}
      </span>
    ) : null;
  }

  const handleChange = async (newStatus: CaseStatus) => {
    const previous = localStatus;
    setLocalStatus(newStatus);
    setError('');
    setSaving(true);
    try {
      await caseService.updateCase(caseId, { status: newStatus });
      onChanged?.(newStatus);
    } catch (err) {
      setLocalStatus(previous);
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={localStatus}
      disabled={saving}
      title={error || undefined}
      onChange={e => handleChange(e.target.value as CaseStatus)}
      onClick={e => e.stopPropagation()}
      className={`text-xs px-2 py-0.5 rounded-md font-medium outline-none cursor-pointer disabled:opacity-50 ${error ? 'ring-2 ring-medical-malignant' : ''} ${cfg?.classes ?? ''} ${className}`}
    >
      {STATUS_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
