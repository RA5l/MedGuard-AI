import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FolderHeart,
  Clock,
  Zap,
  AlertTriangle,
  Upload,
  Plus,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCases } from '../hooks/useCases';
import { STATUS_CONFIG, PREDICTION_COLORS } from '../lib/badges';
import Spinner from '../components/Spinner';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { cases, loading } = useCases();

  const total = cases.length;
  const pending = cases.filter(c => c.status === 'pending' || c.status === 'processing').length;
  const aiComplete = cases.filter(c => c.status === 'ai_complete').length;
  const malignant = cases.filter(c => c.ai_prediction === 'Malignant').length;

  // NOTE: colors now use the shared medical-* design tokens (consistent with STATUS_CONFIG)
  // instead of raw Tailwind colors (yellow-400/blue-400/red-400).
  const STATS = [
    { label: 'Total Cases', value: total, icon: FolderHeart, color: 'text-medical-accent' },
    { label: 'Pending Review', value: pending, icon: Clock, color: 'text-(--color-medical-pending)' },
    { label: 'AI Complete', value: aiComplete, icon: Zap, color: 'text-(--color-medical-ai-complete)' },
    { label: 'Malignant', value: malignant, icon: AlertTriangle, color: 'text-medical-malignant' },
  ];

  const recentCases = cases.slice(0, 5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <motion.div variants={item}>
        <h2 className="text-xl font-bold text-medical-text">
          Good {getTimeOfDay()}, {profile?.full_name?.split(' ').slice(0, 2).join(' ')}
        </h2>
        <p className="text-medical-text/50 text-sm mt-0.5">Here's your clinical overview for today.</p>
      </motion.div>

      {/* Stats Cards */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {[
    { label: 'Total Cases',    value: total,      icon: FolderHeart,   chip: 'bg-medical-accent' },
    { label: 'Pending Review', value: pending,    icon: Clock,         chip: 'bg-(--color-medical-pending)' },
    { label: 'AI Complete',    value: aiComplete, icon: Zap,           chip: 'bg-(--color-medical-ai-complete)' },
    { label: 'Malignant',      value: malignant,  icon: AlertTriangle, chip: 'bg-medical-malignant' },
  ].map(stat => (
    <motion.div
      key={stat.label}
      variants={item}
      className="bg-medical-surface border border-medical-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${stat.chip}`}>
          <stat.icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <span className="text-3xl font-bold tracking-tight text-medical-text">
          {loading ? '—' : stat.value}
        </span>
      </div>
      <p className="text-medical-text/60 text-sm font-medium">{stat.label}</p>
    </motion.div>
  ))}
</div>

     {/* Quick Actions */}
<motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <Link
    to="/scans"
    className="bg-medical-surface border border-medical-border rounded-xl p-4 flex items-center gap-3 hover:border-medical-primary/40 hover:shadow-md transition-all"
  >
    <div className="w-11 h-11 rounded-xl bg-medical-primary text-white flex items-center justify-center shrink-0 shadow-sm">
      <Upload className="w-5 h-5" strokeWidth={2} />
    </div>
    <div>
      <p className="font-semibold text-sm text-medical-text">Upload Scan</p>
      <p className="text-xs text-medical-text/40">Add a new mammography image</p>
    </div>
  </Link>

  <Link
    to="/cases"
    className="bg-medical-surface border border-medical-border rounded-xl p-4 flex items-center gap-3 hover:border-medical-accent/40 hover:shadow-md transition-all"
  >
    <div className="w-11 h-11 rounded-xl bg-medical-accent text-white flex items-center justify-center shrink-0 shadow-sm">
      <Plus className="w-5 h-5" strokeWidth={2} />
    </div>
    <div>
      <p className="font-semibold text-sm text-medical-text">New Case</p>
      <p className="text-xs text-medical-text/40">Register a new patient case</p>
    </div>
  </Link>

  <Link
    to="/reports"
    className="bg-medical-surface border border-medical-border rounded-xl p-4 flex items-center gap-3 hover:border-(--color-medical-reported)/40 hover:shadow-md transition-all"
  >
    <div className="w-11 h-11 rounded-xl bg-(--color-medical-reported) text-white flex items-center justify-center shrink-0 shadow-sm">
      <ClipboardList className="w-5 h-5" strokeWidth={2} />
    </div>
    <div>
      <p className="font-semibold text-sm text-medical-text">View Reports</p>
      <p className="text-xs text-medical-text/40">Browse finalized reports</p>
    </div>
  </Link>
</motion.div>

      {/* Recent Cases */}
      <motion.div variants={item} className="bg-medical-surface border border-medical-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-medical-text font-bold text-sm">Recent Cases</h3>
          <Link to="/cases" className="text-medical-accent text-xs font-medium flex items-center gap-1 hover:gap-1.5 transition-all">
            View all <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : recentCases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-medical-bg flex items-center justify-center mb-3">
              <FolderHeart className="w-6 h-6 text-medical-text/25" strokeWidth={1.5} />
            </div>
            <p className="text-medical-text/40 text-sm">Cases will appear here</p>
            <p className="text-medical-text/25 text-xs mt-1">Upload your first scan to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-medical-border">
                  {['Case Code', 'Patient', 'Status', 'AI Result', 'Date'].map(h => (
                    <th key={h} className="px-2 py-2 text-left text-medical-text/40 font-medium text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentCases.map(c => (
                  <tr key={c.case_id} className="border-b border-medical-border/50 last:border-0">
                    <td className="px-2 py-2.5 font-mono font-semibold text-medical-accent text-xs">{c.case_code}</td>
                    <td className="px-2 py-2.5 text-medical-text/70">{c.patient_alias ?? '—'}</td>
                    <td className="px-2 py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-md border font-medium inline-flex items-center gap-1 ${STATUS_CONFIG[c.status]?.classes ?? ''}`}>
                        {(() => {
                          const Icon = STATUS_CONFIG[c.status]?.icon;
                          return Icon ? <Icon className="w-3 h-3" strokeWidth={2.5} /> : null;
                        })()}
                        {STATUS_CONFIG[c.status]?.label ?? c.status}
                      </span>
                    </td>
                    <td className={`px-2 py-2.5 text-xs font-bold ${c.ai_prediction ? PREDICTION_COLORS[c.ai_prediction] ?? '' : 'text-medical-text/30'}`}>
                      {c.ai_prediction
                        ? `${c.ai_prediction} ${c.ai_confidence ? `(${(c.ai_confidence * 100).toFixed(0)}%)` : ''}`
                        : '—'}
                    </td>
                    <td className="px-2 py-2.5 text-medical-text/40 text-xs">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}