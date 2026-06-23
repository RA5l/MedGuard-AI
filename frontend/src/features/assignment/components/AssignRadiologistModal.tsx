import { useState, useEffect } from 'react';
import { X, UserCheck, Loader2, WifiOff } from 'lucide-react';
import { assignmentService } from '../services/assignmentService';
import { getScopedQuery } from '../../../lib/supabaseClient'; // استيراد دالة السكيما المعتمدة لديكِ

interface Props {
  caseId: string;
  caseCode: string;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignRadiologistModal({ caseId, caseCode, onClose, onAssigned }: Props) {
  const [radiologists, setRadiologists] = useState<any[]>([]);
  const [loadingRads, setLoadingRads] = useState(true);
  const [loadError, setLoadError] = useState('');
  
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    async function fetchRadiologists() {
      try {
        setLoadingRads(true);
        setLoadError('');
        
        const { data, error: fetchErr } = await getScopedQuery('users')
          .select('id, full_name, email, is_active, specialty, role_id')
          .eq('role_id', '6f9f4ca8-63a1-4cac-8251-aa2e127cd5b6')
          .eq('is_active', true); 
        if (fetchErr) throw fetchErr;
        setRadiologists(data || []);
      } catch (err) {
        console.error('Error in AssignRadiologistModal:', err);
        setLoadError(err instanceof Error ? err.message : 'Failed to load radiologists.');
      } finally {
        setLoadingRads(false);
      }
    }

    fetchRadiologists();
  }, []);

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    try {
      await assignmentService.assignCase(caseId, selectedId);
      onAssigned();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to assign radiologist.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-medical-surface border border-medical-border rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-medical-primary/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-medical-primary" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-medical-text">Assign to Radiologist</h3>
              <p className="text-xs text-medical-text/50">
                Case: <span className="font-mono font-semibold">{caseCode}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-medical-text/40 hover:text-medical-text transition-colors">
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div>
          <label className="block text-xs font-medium text-medical-text/60 mb-2">
            Select Radiologist
          </label>

          {loadingRads ? (
            <div className="flex items-center gap-2 text-xs text-medical-text/50 py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading radiologists…
            </div>
          ) : loadError ? (
            <div className="flex items-center gap-2 text-xs text-red-400 py-4">
              <WifiOff className="w-4 h-4 shrink-0" /> {loadError}
            </div>
          ) : radiologists.length === 0 ? (
            <div className="text-xs text-medical-text/40 py-4 text-center border border-dashed border-medical-border rounded-xl">
              No radiologists found in the system.
              <br />
              <span className="text-medical-text/30">Ask an admin to add radiologist accounts.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {radiologists.map(r => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedId === r.id
                      ? 'border-medical-primary bg-medical-primary/5'
                      : 'border-medical-border hover:border-medical-border/80 hover:bg-medical-bg/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="radiologist"
                    value={r.id}
                    checked={selectedId === r.id}
                    onChange={() => setSelectedId(r.id)}
                    className="mt-0.5 accent-medical-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-medical-text truncate">{r.full_name}</p>
                      {!r.is_active && (
                        <span className="shrink-0 text-[10px] font-medium text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-medical-text/50 truncate">
                      {r.specialty ? r.specialty : r.email}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-medical-border">
          <button
            onClick={handleAssign}
            disabled={!selectedId || saving}
            className="flex-1 bg-medical-primary text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <UserCheck className="w-4 h-4" strokeWidth={2.5} />
            }
            Send to Radiologist
          </button>
          <button
            onClick={onClose}
            className="px-4 text-sm font-semibold text-medical-text/60 rounded-xl border border-medical-border hover:bg-medical-bg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}