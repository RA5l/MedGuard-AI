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
  ShieldCheck,
  FileText,
  BellRing,
  Activity,
  ScanSearch,
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useCases } from '../../cases/hooks/useCases';
import { STATUS_CONFIG, PREDICTION_COLORS } from '../../../lib/badges';
import Spinner from '../../../components/Spinner';
import { formatDate, getTimeOfDay } from '../../../utils/date';
import type { ElementType } from 'react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const { cases, loading } = useCases();

  const total = cases.length;
  const pending = cases.filter(c => c.status === 'pending' || c.status === 'processing').length;
  const aiComplete = cases.filter(c => c.status === 'ai_complete').length;
  const malignant = cases.filter(c => c.ai_prediction === 'Malignant').length;
  const highPriority = cases.filter(c => c.priority >= 3).length;

  const STATS = [
    { label: 'Active Studies', value: total, icon: FolderHeart, chip: 'bg-medical-accent', note: 'Patient cases and mammography studies in the current queue' },
    { label: 'Awaiting Review', value: pending, icon: Clock, chip: 'bg-(--color-medical-pending)', note: 'Cases pending radiologist or clinician review' },
    { label: 'AI Analysis Ready', value: aiComplete, icon: Zap, chip: 'bg-(--color-medical-ai-complete)', note: 'Automated triage and lesion assessment completed' },
    { label: 'Urgent Findings', value: highPriority, icon: AlertTriangle, chip: 'bg-medical-malignant', note: 'High-priority findings requiring rapid escalation' },
  ];

  const recentCases = cases.slice(0, 5);
  const firstName = profile?.full_name?.split(' ').slice(0, 2).join(' ');

  const pendingReviews = [
    { code: 'P-1048', patient: 'Study A · Right breast', status: 'Awaiting review', time: '12 min ago' },
    { code: 'P-1039', patient: 'Study B · Left breast', status: 'Needs confirmation', time: '28 min ago' },
    { code: 'P-1027', patient: 'Study C · Bilateral', status: 'AI flagged', time: '41 min ago' },
  ];

  const recentReports = [
    { title: 'Mammography Summary', type: 'Finalized report', owner: 'Dr. Ali', time: 'Today, 09:30' },
    { title: 'Radiology Follow-up', type: 'Draft review', owner: 'Dr. Khan', time: 'Yesterday, 16:10' },
    { title: 'Screening Escalation', type: 'Escalated case', owner: 'Team', time: 'Yesterday, 11:45' },
  ];

  const timeline = [
    { title: 'Mammography study uploaded', detail: 'P-1048 · Right breast screening study received', time: '09:18' },
    { title: 'AI analysis finalized', detail: 'High-confidence malignant risk flag generated', time: '08:52' },
    { title: 'Case reassigned for review', detail: 'Dr. Ali assigned to P-1039 for radiology sign-off', time: '08:20' },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
    >
      <motion.section variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-medical-accent">Breast Screening Operations</p>
            <h2 className="mt-2 text-2xl font-bold text-medical-text">Good {getTimeOfDay()}, {firstName || 'Radiology Team'}</h2>
            <p className="mt-1 text-sm text-medical-text/70">Review mammography studies, verify AI analysis, and prioritize radiologist sign-off across active screening cases.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-medical-text/60">
            <span className="rounded-full border border-medical-border bg-medical-bg px-3 py-1">Live screening queue</span>
            <span className="rounded-full border border-medical-border bg-medical-bg px-3 py-1">{cases.length} total cases</span>
            <span className="rounded-full border border-medical-border bg-medical-bg px-3 py-1">{malignant} malignant flags</span>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <motion.div variants={item} className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {STATS.map(stat => (
              <article key={stat.label} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm transition-all hover:border-medical-primary/30 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-medical-text/50">{stat.label}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-medical-text">{loading ? '—' : stat.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm ${stat.chip}`}>
                    <stat.icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-medical-text/60">{stat.note}</p>
              </article>
            ))}
          </motion.div>

          <motion.article variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-medical-text">Recent Patient Cases</h3>
                <p className="text-xs text-medical-text/60">Latest mammography studies, AI findings, and review status.</p>
              </div>
              <Link to="/cases" className="inline-flex items-center gap-1 text-xs font-semibold text-medical-accent hover:gap-2">View all <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} /></Link>
            </div>
            {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-medical-border bg-medical-bg/60 text-medical-text/50">
                      {['Case Code', 'Patient', 'Status', 'AI Result', 'Date'].map(h => <th key={h} className="px-3 py-3 text-left text-xs uppercase tracking-wider">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCases.map(c => {
                      const cfg = STATUS_CONFIG[c.status];
                      const Icon = cfg?.icon as ElementType | undefined;
                      return (
                        <tr key={c.id} className="border-b border-medical-border/50 last:border-0 hover:bg-medical-border/20">
                          <td className="px-3 py-3 font-mono text-xs font-semibold text-medical-accent">{c.case_code}</td>
                          <td className="px-3 py-3 text-medical-text/80">{c.patient_alias ?? '—'}</td>
                          <td className="px-3 py-3"><span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${cfg?.classes ?? ''}`}>{Icon && <Icon className="h-3 w-3" strokeWidth={2.5} />}{cfg?.label ?? c.status}</span></td>
                          <td className={`px-3 py-3 text-xs font-bold ${c.ai_prediction ? PREDICTION_COLORS[c.ai_prediction] ?? '' : 'text-medical-text/30'}`}>{c.ai_prediction ? `${c.ai_prediction}${c.ai_confidence ? ` (${(c.ai_confidence * 100).toFixed(0)}%)` : ''}` : '—'}</td>
                          <td className="px-3 py-3 text-xs text-medical-text/50">{formatDate(c.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.article>

          <motion.article variants={item} className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-medical-text">Radiologist Worklist</h3>
                  <p className="text-xs text-medical-text/60">Cases awaiting interpretation, confirmation, or escalation.</p>
                </div>
                <BellRing className="h-4 w-4 text-medical-accent" strokeWidth={2} />
              </div>
              <div className="space-y-3">
                {pendingReviews.map(item => (
                  <article key={item.code} className="rounded-xl border border-medical-border bg-medical-bg/70 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-medical-text">{item.code}</p>
                        <p className="text-xs text-medical-text/60">{item.patient}</p>
                      </div>
                      <span className="rounded-full bg-medical-pending-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-medical-pending">{item.status}</span>
                    </div>
                    <p className="mt-2 text-[11px] text-medical-text/50">{item.time}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-medical-text">Recent Clinical Reports</h3>
                  <p className="text-xs text-medical-text/60">Latest finalized and draft mammography reports linked to active studies.</p>
                </div>
                <FileText className="h-4 w-4 text-medical-accent" strokeWidth={2} />
              </div>
              <div className="space-y-3">
                {recentReports.map(report => (
                  <article key={report.title} className="rounded-xl border border-medical-border bg-medical-bg/70 p-3">
                    <p className="text-sm font-semibold text-medical-text">{report.title}</p>
                    <p className="mt-1 text-xs text-medical-text/60">{report.type} · {report.owner}</p>
                    <p className="mt-2 text-[11px] text-medical-text/50">{report.time}</p>
                  </article>
                ))}
              </div>
            </section>
          </motion.article>
        </div>

        <aside className="space-y-6">
          <motion.article variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-medical-text">High Priority Findings</h3>
                <p className="text-xs text-medical-text/60">Cases flagged for immediate radiology follow-up or escalation.</p>
              </div>
              <ShieldCheck className="h-4 w-4 text-medical-malignant" strokeWidth={2} />
            </div>
            <div className="space-y-3">
              {cases.slice(0, 3).map(c => (
                <article key={c.id} className="rounded-xl border border-medical-border bg-medical-bg/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-medical-text">{c.case_code}</p>
                    <span className="rounded-full bg-medical-malignant-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-medical-malignant">{c.priority >= 3 ? 'Urgent' : 'Review'}</span>
                  </div>
                  <p className="mt-1 text-xs text-medical-text/60">{c.patient_alias ?? 'Unassigned patient'} · {c.ai_prediction ?? 'AI result pending'}</p>
                </article>
              ))}
            </div>
          </motion.article>

          <motion.article variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-medical-text">Clinical Workflow Actions</h3>
                <p className="text-xs text-medical-text/60">Direct paths to mammography upload, case creation, and report review.</p>
              </div>
              <ScanSearch className="h-4 w-4 text-medical-accent" strokeWidth={2} />
            </div>
            <div className="space-y-2">
              {[
                { to: '/scans', label: 'Upload Mammography Study', icon: Upload },
                { to: '/cases', label: 'Open Screening Case', icon: Plus },
                { to: '/reports', label: 'Review Reports', icon: ClipboardList },
              ].map(action => (
                <Link key={action.to} to={action.to} className="flex items-center justify-between rounded-xl border border-medical-border bg-medical-bg/70 px-3 py-3 text-sm text-medical-text hover:border-medical-primary/30 hover:bg-medical-border/30">
                  <span className="flex items-center gap-2"><action.icon className="h-4 w-4" strokeWidth={2} />{action.label}</span>
                  <ArrowRight className="h-4 w-4 text-medical-text/40" strokeWidth={2} />
                </Link>
              ))}
            </div>
          </motion.article>

          <motion.article variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-medical-text">Audit Trail</h3>
                <p className="text-xs text-medical-text/60">Recent screening events and review activity recorded for traceability.</p>
              </div>
              <Activity className="h-4 w-4 text-medical-accent" strokeWidth={2} />
            </div>
            <div className="space-y-3 border-l border-medical-border pl-4">
              {timeline.map(entry => (
                <article key={entry.title} className="relative">
                  <span className="absolute left-[-1.05rem] top-1.5 h-2.5 w-2.5 rounded-full bg-medical-accent" />
                  <p className="text-sm font-semibold text-medical-text">{entry.title}</p>
                  <p className="text-xs text-medical-text/60">{entry.detail}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-medical-text/45">{entry.time}</p>
                </article>
              ))}
            </div>
          </motion.article>
        </aside>
      </section>
    </motion.div>
  );
}
