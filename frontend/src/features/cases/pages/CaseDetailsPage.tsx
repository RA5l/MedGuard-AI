import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowLeft, ImageOff, Pencil, Upload, Save, X,
  Trash2, AlertTriangle, UserCheck,
} from 'lucide-react';
import { caseService } from '../../cases/services/caseService';
import { logAudit } from '../../../lib/auditLog';
import { supabase } from '../../../lib/supabaseClient';
import { useScans } from '../../cases/hooks/useScans';
import { useAuth } from '../../auth/context/AuthContext';
import { PRIORITY_CONFIG } from '../../../lib/badges';
import StatusQuickEdit from '../../../components/StatusQuickEdit';
import { MEDICAL_TOKENS } from '../../../lib/tokens';
import Spinner from '../../../components/Spinner';
import type { Case, CaseStatus } from '../../cases/types/index';
import { formatDate } from '../../../utils/date';
import { useAssignment } from '../../assignment/hooks/useAssignment';
import AssignRadiologistModal from '../../assignment/components/AssignRadiologistModal';
import AssignmentPanel from '../../assignment/components/AssignmentPanel';

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: 'pending',     label: 'Pending'      },
  { value: 'processing',  label: 'Processing'   },
  { value: 'ai_complete', label: 'AI Complete'  },
  { value: 'assigned',    label: 'Assigned'     },
  { value: 'in_review',   label: 'In Review'    },
  { value: 'reviewed',    label: 'Reviewed'     },
  { value: 'rejected',    label: 'Rejected'     },
  { value: 'reported',    label: 'Reported'     },
  { value: 'archived',    label: 'Archived'     },
];

export default function CaseDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isAdmin       = profile?.role === 'admin';
  const isDoctor      = profile?.role === 'doctor';
  const isRadiologist = profile?.role === 'radiologist';
  const canEdit       = isAdmin || isDoctor;
  const canChangeStatus = canEdit || isRadiologist;
  const canAssign     = isAdmin || isDoctor;

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason]         = useState('');
  const [deleting, setDeleting]                 = useState(false);
  const [deleteError, setDeleteError]           = useState('');

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading]   = useState(true);
  const { scans, loading: scansLoading } = useScans(id ?? '');

  const { assignment, reload: reloadAssignment } = useAssignment(id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState<{
    patient_alias: string; notes: string; status: CaseStatus; priority: number;
  }>({ patient_alias: '', notes: '', status: 'pending', priority: 0 });

  const loadCase = () => {
    if (!id) return;
    caseService.getCaseById(id)
      .then(data => setCaseData(data))
      .catch(() => setCaseData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCase();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && id) await logAudit(session.user.id, 'CASE_VIEWED', 'cases', id, {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startEditing = () => {
    if (!caseData) return;
    setForm({
      patient_alias: caseData.patient_alias ?? '',
      notes: caseData.notes ?? '',
      status: caseData.status,
      priority: caseData.priority ?? 0,
    });
    setSaveError('');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaveError('');
    try {
      await caseService.updateCase(id, form);
      const refreshed = await caseService.getCaseById(id);
      setCaseData(refreshed);
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="sm" /></div>;
  if (!caseData) return <div className="text-center py-16 text-medical-text/40 text-sm">Case not found.</div>;

  const { typography: { scales } } = MEDICAL_TOKENS;
  const priorityCfg = PRIORITY_CONFIG[caseData.priority];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/cases')}
          className="text-medical-text/40 hover:text-medical-text text-sm flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Back to Cases
        </button>

        <div className="flex items-center gap-3">
          {/* Send to Radiologist */}
          {canAssign && (
  <>
    {/* No assignment yet */}
    {!assignment && (
      <button
        onClick={() => setShowAssignModal(true)}
        className="text-sm font-semibold text-medical-primary flex items-center gap-1.5 hover:opacity-80 transition-opacity"
      >
        <UserCheck className="w-3.5 h-3.5" strokeWidth={2} /> Send to Radiologist
      </button>
    )}

    {/* Issue B fix: show re-assign when rejected OR more_info_requested */}
    {assignment && (
      assignment.status === 'rejected' ||
      assignment.status === 'more_info_requested'
    ) && (
      <button
        onClick={() => setShowAssignModal(true)}
        className="text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all hover:opacity-90"
        style={{
          color: 'var(--color-primary)',
          borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
          backgroundColor: 'var(--color-primary-light)',
        }}
      >
        <UserCheck className="w-3.5 h-3.5" strokeWidth={2} />
        {assignment.status === 'rejected' ? 'Re-assign to Radiologist' : 'Re-assign (Info Provided)'}
      </button>
    )}
  </>
)}

          {canEdit && !editing && (
            <button
              onClick={startEditing}
              className="text-sm font-semibold text-medical-primary flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <Pencil className="w-3.5 h-3.5" strokeWidth={2} /> Edit Case
            </button>
          )}

          {isAdmin && !editing && (
            <button
              onClick={() => { setDeleteDialogOpen(true); setDeleteReason(''); setDeleteError(''); }}
              className="text-sm font-semibold text-medical-malignant flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} /> Delete Case
            </button>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && caseData && (
        <AssignRadiologistModal
          caseId={caseData.id}
          caseCode={caseData.case_code}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => { reloadAssignment(); loadCase(); }}
        />
      )}

      {/* Delete Dialog */}
      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !deleting && setDeleteDialogOpen(false)}
        >
          <div className="bg-medical-surface border border-medical-border rounded-2xl p-6 max-w-md w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-medical-malignant">
              <AlertTriangle className="w-5 h-5" strokeWidth={2} />
              <h3 className="text-base font-bold text-medical-text">Delete this case?</h3>
            </div>
            <p className="text-sm text-medical-text/60">
              Case ({caseData.case_code}) will be hidden from all views. Soft-delete only.
              <span className="block mt-1 font-semibold">هل أنت متأكد؟</span>
            </p>
            <div>
              <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Reason (required)</label>
              <input
                type="text"
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="e.g. duplicate entry, entered in error…"
                className="w-full px-3 py-2 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-malignant/30"
              />
            </div>
            {deleteError && <p className="text-xs text-medical-malignant">{deleteError}</p>}
            <div className="flex gap-2 pt-1">
              <button
                onClick={async () => {
                  if (!id || !deleteReason.trim()) { setDeleteError('A reason is required.'); return; }
                  setDeleting(true); setDeleteError('');
                  try {
                    await caseService.softDeleteCase(id, deleteReason.trim());
                    navigate('/cases');
                  } catch (err) {
                    setDeleteError(err instanceof Error ? err.message : 'Failed to delete case.');
                    setDeleting(false);
                  }
                }}
                disabled={deleting || !deleteReason.trim()}
                className="bg-medical-malignant text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" strokeWidth={2.5} />} Confirm Delete
              </button>
              <button
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
                className="text-sm font-semibold text-medical-text/60 px-4 py-2 rounded-lg border border-medical-border hover:bg-medical-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case header */}
      {!editing && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`${scales.heading} font-mono text-medical-primary`}>{caseData.case_code}</h2>
              <StatusQuickEdit caseId={caseData.id} status={caseData.status} canEdit={canChangeStatus} onChanged={loadCase} />
            </div>
            <p className={`${scales.body} text-medical-text/60`}>
              Patient: <span className="text-medical-text font-semibold">{caseData.patient_alias ?? '—'}</span>
            </p>
          </div>
          {priorityCfg && (
            <div className="sm:text-right">
              <span className={`text-sm font-bold ${priorityCfg.color}`}>{priorityCfg.label} Priority</span>
            </div>
          )}
        </div>
      )}

      {/* Assignment panel — visible to all roles */}
      {assignment && (
        <AssignmentPanel
          assignment={assignment}
          role={isRadiologist ? 'radiologist' : isAdmin ? 'admin' : 'doctor'}
          onUpdated={() => { reloadAssignment(); loadCase(); }}
        />
      )}

      {/* Re-assign button when rejected */}
      {canAssign && assignment?.status === 'rejected' && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAssignModal(true)}
            className="text-sm font-semibold text-medical-primary flex items-center gap-1.5 hover:opacity-80 border border-medical-border px-3 py-2 rounded-lg transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" strokeWidth={2} /> Re-assign to Another Radiologist
          </button>
        </div>
      )}

      {/* Clinical notes */}
      {!editing && caseData.notes && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
          <h3 className={scales.caption}>Clinical Notes</h3>
          <p className={`${scales.body} text-medical-text/80 mt-2 whitespace-pre-wrap leading-relaxed`}>{caseData.notes}</p>
        </div>
      )}

      {/* Edit panel */}
      {editing && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-6 space-y-4">
          <h3 className={`${scales.subheading} text-medical-text`}>Edit Case — {caseData.case_code}</h3>
          <div>
            <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Patient Alias</label>
            <input type="text" value={form.patient_alias} onChange={e => setForm(f => ({ ...f, patient_alias: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-accent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CaseStatus }))}
              className="w-full px-3 py-2 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-accent">
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-accent">
              <option value={0}>Routine</option>
              <option value={1}>Low</option>
              <option value={2}>High</option>
              <option value={3}>Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-medical-text/60 mb-1.5">Clinical Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={4}
              className="w-full px-3 py-2 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-accent resize-none" />
          </div>
          {saveError && <p className="text-xs text-medical-malignant">{saveError}</p>}
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="bg-medical-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50">
              {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" strokeWidth={2.5} />} Save
            </button>
            <button onClick={() => setEditing(false)} disabled={saving}
              className="text-sm font-semibold text-medical-text/60 px-4 py-2 rounded-lg border border-medical-border hover:bg-medical-bg transition-colors flex items-center gap-2">
              <X className="w-4 h-4" strokeWidth={2} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* AI result */}
      {caseData.ai_prediction && (
        <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
          <h3 className={scales.caption}>AI Analysis</h3>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-lg font-bold text-medical-text">{caseData.ai_prediction}</span>
            {caseData.ai_confidence !== undefined && (
              <span className="text-sm text-medical-text/50">{(caseData.ai_confidence * 100).toFixed(0)}% confidence</span>
            )}
          </div>
        </div>
      )}

      {/* Scans */}
      <div className="bg-medical-surface border border-medical-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${scales.subheading} text-medical-text`}>Linked Scans</h3>
          {canEdit && (
            <button onClick={() => navigate(`/scans?case=${id}`)}
              className="text-xs font-semibold text-medical-primary flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Upload className="w-3.5 h-3.5" strokeWidth={2} /> Upload Scan
            </button>
          )}
        </div>
        {scansLoading ? (
          <div className="flex justify-center py-6"><Spinner size="sm" /></div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center text-medical-text/40">
            <ImageOff className="w-8 h-8 mb-2 opacity-40" strokeWidth={1.5} />
            <p className={scales.body}>No scans linked to this case.</p>
            <p className="text-xs mt-1 text-medical-text/30">Upload scans from the Scan Upload page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {scans.map(scan => (
              <div key={scan.id} className="border border-medical-border bg-medical-bg rounded-xl overflow-hidden">
                <div className="aspect-square bg-medical-surface flex items-center justify-center p-2">
                  <img src={scan.original_scan_url} alt={`${scan.scan_view_type} scan`}
                    className="object-contain max-h-full max-w-full rounded" />
                </div>
                <div className="p-3 bg-medical-surface border-t border-medical-border">
                  <p className="text-xs font-bold text-medical-primary truncate">{scan.scan_view_type}</p>
                  <p className="text-[10px] text-medical-text/40 uppercase font-mono mt-0.5">
                    {scan.laterality} · {formatDate(scan.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
