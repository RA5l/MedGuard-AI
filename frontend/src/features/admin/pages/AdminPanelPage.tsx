import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, UserCheck, Stethoscope, ScanLine, X } from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { ROLE_CONFIG, ACTIVE_STATUS_CLASSES } from '../../../lib/badges';
import Spinner from './../../../components/Spinner';
import Select from './../../../components/Select';
import { formatDate } from '../../../utils/date';
import { getUserFriendlyError } from '../../../lib/errorMessages';
import type { ElementType } from 'react';

// Local badge components

function RoleBadge({ role }: { role: string }) {
  const cfg  = ROLE_CONFIG[role];
  const Icon = cfg?.icon as ElementType | undefined;
  return (
    <span className={`text-xs px-2 py-1 rounded-md font-semibold inline-flex items-center gap-1 ${cfg?.classes ?? ''}`}>
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.5} />}
      {cfg?.label ?? role}
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-md font-semibold border ${active ? ACTIVE_STATUS_CLASSES.active : ACTIVE_STATUS_CLASSES.inactive}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// Constants

const ROLE_OPTIONS = [
  { value: 'doctor',      label: 'Doctor'      },
  { value: 'radiologist', label: 'Radiologist' },
];

// Page

export default function AdminPanelPage() {
  const { users, loading, error, createUser, deactivateUser } = useUsers();

  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState({ email: '', password: '', full_name: '', role: 'doctor', specialty: '' });
  const [creating, setCreating]       = useState(false);
  const [formError, setFormError]     = useState('');
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const totalDoctors      = users.filter(u => u.role === 'doctor').length;
  const totalRadiologists = users.filter(u => u.role === 'radiologist').length;
  const totalActive       = users.filter(u => u.is_active).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.email || !form.password || !form.full_name) {
      setFormError('Name, email, and password are required.');
      return;
    }
    setCreating(true);
    try {
      await createUser(form);
      setShowModal(false);
      setForm({ email: '', password: '', full_name: '', role: 'doctor', specialty: '' });
    } catch (err: unknown) {
      setFormError(getUserFriendlyError(err, 'Failed to create user.'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (userId: string, userName: string) => {
    if (!confirm(`Deactivate ${userName}?`)) return;
    setDeactivating(userId);
    try {
      await deactivateUser(userId);
    } catch (err: unknown) {
      setFormError(getUserFriendlyError(err, 'Failed to deactivate user.'));
    } finally {
      setDeactivating(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-medical-text">Admin Panel</h2>
          <p className="text-medical-text/70 text-sm mt-0.5">Manage clinician accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-medical-primary text-white text-sm font-bold px-4 py-2.5 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 self-start shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> New User
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Users',  value: users.length,      icon: Users,       chip: 'bg-medical-accent'                         },
          { label: 'Active',       value: totalActive,       icon: UserCheck,   chip: 'bg-medical-normal'                         },
          { label: 'Doctors',      value: totalDoctors,      icon: Stethoscope, chip: 'bg-(--color-medical-role-doctor)'           },
          { label: 'Radiologists', value: totalRadiologists, icon: ScanLine,    chip: 'bg-(--color-medical-role-radiologist)'      },
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-medical-surface border border-medical-border rounded-xl p-4 flex flex-col gap-4 hover:shadow-md hover:border-medical-primary/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${stat.chip}`}>
                <stat.icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <p className="text-3xl font-bold tracking-tight text-medical-text">{stat.value}</p>
            </div>
            <p className="text-medical-text/70 text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-medical-surface border border-medical-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-medical-border">
          <h3 className="text-medical-text font-bold text-sm">Clinician Accounts</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Spinner /></div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-medical-malignant text-sm">{error}</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-medical-border bg-medical-bg/50">
                    {['Name', 'Email', 'Role', 'Specialty', 'Status', 'Joined', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-medical-text/40 font-semibold text-xs uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.025 }}
                      className="border-b border-medical-border/50 hover:bg-medical-border/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-medical-primary flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold uppercase">
                              {user.full_name?.charAt(0)}
                            </span>
                          </div>
                          <span className="text-medical-text font-medium text-sm">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-medical-text/60 text-xs">{user.email}</td>
                      <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                      <td className="px-4 py-3 text-medical-text/50 text-xs">{user.specialty ?? '—'}</td>
                      <td className="px-4 py-3"><ActiveBadge active={user.is_active} /></td>
                      <td className="px-4 py-3 text-medical-text/40 text-xs">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        {user.is_active && user.role !== 'admin' && (
                          <button
                            onClick={() => handleDeactivate(user.id, user.full_name)}
                            disabled={deactivating === user.id}
                            className="text-xs text-medical-malignant/60 hover:text-medical-malignant transition-colors disabled:opacity-40 font-medium"
                          >
                            {deactivating === user.id ? 'Deactivating…' : 'Deactivate'}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-medical-border/50">
              {users.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="p-4"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-full bg-medical-primary flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold uppercase">{user.full_name?.charAt(0)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-medical-text font-semibold text-sm truncate">{user.full_name}</p>
                      <p className="text-medical-text/40 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <RoleBadge role={user.role} />
                    <ActiveBadge active={user.is_active} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-medical-text/40">
                    <span>{user.specialty ?? '—'}</span>
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                  {user.is_active && user.role !== 'admin' && (
                    <button
                      onClick={() => handleDeactivate(user.id, user.full_name)}
                      disabled={deactivating === user.id}
                      className="text-xs text-medical-malignant/60 hover:text-medical-malignant transition-colors disabled:opacity-40 font-medium mt-2"
                    >
                      {deactivating === user.id ? 'Deactivating…' : 'Deactivate'}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-medical-bg/85 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-medical-surface border border-medical-border rounded-2xl p-6 w-full max-w-md shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-medical-primary flex items-center justify-center shrink-0 shadow-sm">
                    <Users className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-medical-text font-bold text-base">Create New User</h3>
                    <p className="text-medical-text/40 text-xs mt-0.5">Add a clinician account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-medical-text/40 hover:text-medical-text transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-(--color-medical-malignant-soft) border border-medical-malignant/30 text-medical-malignant text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-medical-text/70 text-sm font-medium mb-1.5">
                    Full Name <span className="text-medical-malignant">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. Sarah Ahmed"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border-2 border-medical-border bg-medical-bg text-medical-text text-sm placeholder:text-medical-text/25 focus:border-medical-accent focus:ring-2 focus:ring-medical-accent/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-medical-text/70 text-sm font-medium mb-1.5">
                    Email <span className="text-medical-malignant">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="doctor@hospital.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border-2 border-medical-border bg-medical-bg text-medical-text text-sm placeholder:text-medical-text/25 focus:border-medical-accent focus:ring-2 focus:ring-medical-accent/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-medical-text/70 text-sm font-medium mb-1.5">
                    Password <span className="text-medical-malignant">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full p-2.5 rounded-lg border-2 border-medical-border bg-medical-bg text-medical-text text-sm placeholder:text-medical-text/25 focus:border-medical-accent focus:ring-2 focus:ring-medical-accent/20 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-medical-text/70 text-sm font-medium mb-1.5">Role</label>
                    <Select
                      value={form.role}
                      onChange={v => setForm({ ...form, role: v })}
                      options={ROLE_OPTIONS}
                    />
                  </div>
                  <div>
                    <label className="block text-medical-text/70 text-sm font-medium mb-1.5">Specialty</label>
                    <input
                      type="text"
                      placeholder="Radiology"
                      value={form.specialty}
                      onChange={e => setForm({ ...form, specialty: e.target.value })}
                      className="w-full p-2.5 rounded-lg border-2 border-medical-border bg-medical-bg text-medical-text text-sm placeholder:text-medical-text/25 focus:border-medical-accent focus:ring-2 focus:ring-medical-accent/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 p-2.5 rounded-lg border-2 border-medical-border text-medical-text/60 text-sm font-medium hover:bg-medical-border/40 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 p-2.5 rounded-lg bg-medical-primary text-white text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating
                      ? <><Spinner size="sm" className="border-white" /> Creating…</>
                      : 'Create User'
                    }
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
