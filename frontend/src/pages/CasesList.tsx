import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FolderHeart, X } from 'lucide-react';
import { useCases } from '../hooks/useCases';
import { useAuth } from '../contexts/AuthContext';
import { STATUS_CONFIG, PRIORITY_CONFIG, PREDICTION_COLORS } from '../lib/badges';
import Spinner from '../components/Spinner';
import Select from '../components/Select';

// Small shared badge — used in both the desktop table and the mobile card view.
function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  const Icon = config?.icon;
  return (
    <span className={`text-xs px-2 py-1 rounded-md border font-medium inline-flex items-center gap-1 ${config?.classes ?? ''}`}>
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.5} />}
      {config?.label ?? status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = config?.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config?.color ?? ''}`}>
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.5} />}
      {config?.label}
    </span>
  );
}

export default function CasesList() {
  const navigate = useNavigate();
  // `profile` is kept for future role-based actions on this page.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profile } = useAuth();
  const { cases, loading, error, createCase } = useCases();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({ case_code: '', patient_alias: '', priority: 0, notes: '' });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const filtered = cases.filter(c => {
    const matchSearch =
      c.case_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.patient_alias ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? c.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.case_code.trim()) {
      setFormError('Case code is required');
      return;
    }
    setCreating(true);
    try {
      await createCase(form);
      setShowModal(false);
      setForm({ case_code: '', patient_alias: '', priority: 0, notes: '' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create case';
      setFormError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-medical-text">Cases</h2>
          <p className="text-medical-text/40 text-sm mt-0.5">
            {cases.length} total case{cases.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-medical-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> New Case
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medical-text/30" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search by case code or patient alias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-medical-border bg-medical-surface text-medical-text text-sm placeholder:text-medical-text/30 focus:ring-2 focus:ring-medical-accent focus:border-transparent outline-none transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-medical-text/30 hover:text-medical-text/60 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="p-2.5 rounded-lg border border-medical-border bg-medical-surface text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-accent transition-all"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="ai_complete">AI Complete</option>
          <option value="reviewed">Reviewed</option>
          <option value="reported">Reported</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Cases */}
      <div className="bg-medical-surface border border-medical-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-3">
              <FolderHeart className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
            </div>
            <p className="text-medical-text/40 text-sm">No cases found</p>
            <p className="text-medical-text/25 text-xs mt-1">Create your first case to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop table — md and up */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-medical-border">
                    {['Case Code', 'Patient', 'Status', 'Priority', 'Scans', 'AI Result', 'Doctor', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-medical-text/40 font-medium text-xs uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <motion.tr
                      key={c.case_id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/cases/${c.case_id}`)}
                      className="border-b border-medical-border/50 hover:bg-medical-border/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-medical-accent text-xs">{c.case_code}</td>
                      <td className="px-4 py-3 text-medical-text/70">{c.patient_alias ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="px-4 py-3 text-medical-text/60 text-center">{c.total_scans}</td>
                      <td className={`px-4 py-3 text-xs font-bold ${c.ai_prediction ? PREDICTION_COLORS[c.ai_prediction] ?? '' : 'text-medical-text/30'}`}>
                        {c.ai_prediction
                          ? `${c.ai_prediction} ${c.ai_confidence ? `(${(c.ai_confidence * 100).toFixed(0)}%)` : ''}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-medical-text/60 text-xs">{c.assigned_doctor_name ?? '—'}</td>
                      <td className="px-4 py-3 text-medical-text/40 text-xs">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list — below md */}
            <div className="md:hidden divide-y divide-medical-border/50">
              {filtered.map((c, i) => (
                <motion.div
                  key={c.case_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/cases/${c.case_id}`)}
                  className="p-4 active:bg-medical-border/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-semibold text-medical-accent text-xs">{c.case_code}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-medical-text font-medium text-sm mb-2">{c.patient_alias ?? '—'}</p>
                  <div className="flex items-center justify-between text-xs">
                    <PriorityBadge priority={c.priority} />
                    <span className={`font-bold ${c.ai_prediction ? PREDICTION_COLORS[c.ai_prediction] ?? '' : 'text-medical-text/30'}`}>
                      {c.ai_prediction
                        ? `${c.ai_prediction} ${c.ai_confidence ? `(${(c.ai_confidence * 100).toFixed(0)}%)` : ''}`
                        : 'No AI result'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5 text-medical-text/40">
                    <span>{c.assigned_doctor_name ?? '—'}</span>
                    <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* New Case Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-medical-surface border border-medical-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-medical-accent/10 text-medical-accent flex items-center justify-center shrink-0">
      <FolderHeart className="w-5 h-5" strokeWidth={2} />
    </div>
    <div>
      <h3 className="text-medical-text font-bold text-base">New Case</h3>
      <p className="text-medical-text/40 text-xs mt-0.5">Register a new patient screening case</p>
    </div>
  </div>
  <button onClick={() => setShowModal(false)} className="text-medical-text/40 hover:text-medical-text transition-colors mt-1" aria-label="Close">
    <X className="w-5 h-5" strokeWidth={2} />
  </button>
</div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{formError}</div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-medical-text/70 text-sm font-medium mb-1.5">
      Case Code <span className="text-red-400">*</span>
    </label>
    <input
      type="text" required placeholder="P_00001"
      value={form.case_code}
      onChange={e => setForm({ ...form, case_code: e.target.value })}
      className="w-full p-2.5 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm font-mono placeholder:text-medical-text/25 focus:ring-2 focus:ring-medical-accent outline-none transition-all"
    />
  </div>
  <div>
    <label className="block text-medical-text/70 text-sm font-medium mb-1.5">Patient Alias</label>
    <input
      type="text" placeholder="Patient A"
      value={form.patient_alias}
      onChange={e => setForm({ ...form, patient_alias: e.target.value })}
      className="w-full p-2.5 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm placeholder:text-medical-text/25 focus:ring-2 focus:ring-medical-accent outline-none transition-all"
    />
  </div>
</div>

<div>
  <label className="block text-medical-text/70 text-sm font-medium mb-1.5">Priority</label>
  <Select
    value={String(form.priority)}
    onChange={v => setForm({ ...form, priority: Number(v) })}
    options={[
      { value: '0', label: 'Routine' },
      { value: '1', label: 'Low' },
      { value: '2', label: 'High' },
      { value: '3', label: 'Urgent' },
    ]}
  />
</div>

                <div>
                  <label className="block text-medical-text/70 text-sm font-medium mb-1.5">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Clinical notes..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm placeholder:text-medical-text/25 focus:ring-2 focus:ring-medical-accent outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 p-2.5 rounded-lg border border-medical-border text-medical-text/60 text-sm hover:bg-medical-border/30 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 p-2.5 rounded-lg bg-medical-primary text-white text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <Spinner size="sm" className="border-white" /> Creating...
                      </>
                    ) : (
                      'Create Case'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}