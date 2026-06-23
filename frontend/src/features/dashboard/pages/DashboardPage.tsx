import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FolderHeart, Clock, Zap, AlertTriangle, Upload, Plus,
  ClipboardList, ArrowRight, ShieldCheck, Activity, ScanSearch,
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useCases } from '../../cases/hooks/useCases';
import { reportService } from '../../reports/services/reportService';
import type { MedicalReport } from '../../reports/services/reportService';
import { auditService } from '../services/auditService';
import type { AuditLogEntry } from '../services/auditService';
import { getUserNamesByIds } from '../../../lib/userLookup';
import { PREDICTION_COLORS } from '../../../lib/badges';
import Spinner from '../../../components/Spinner';
import { formatDate, formatTime, getTimeOfDay } from '../../../utils/date';
import StatusQuickEdit from '../../../components/StatusQuickEdit';
import InfoTooltip from '../../../components/InfoTooltip';
import ClinicalNotificationsWidget from '../../assignment/components/ClinicalNotificationsWidget';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item      = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const ACTION_LABELS: Record<string, string> = {
  CASE_CREATED:               'Case created',
  CASE_UPDATED:               'Case updated',
  CASE_DELETED:               'Case deleted',
  CASE_VIEWED:                'Case opened',
  SCAN_UPLOADED:              'Scan uploaded',
  USER_CREATED:               'User created',
  USER_DEACTIVATED:           'User deactivated',
  REPORT_CREATED:             'Report created',
  REPORT_UPDATED:             'Report updated',
  AI_SUMMARY_GENERATED:       'AI summary generated',
  REPORT_PDF_EXPORTED:        'Report PDF exported',
  AI_ANALYSIS_COMPLETED:      'AI analysis completed',
  CASE_ASSIGNED:              'Case assigned to radiologist',
  ASSIGNMENT_ACCEPTED:        'Assignment accepted',
  ASSIGNMENT_REJECTED:        'Assignment rejected',
  ASSIGNMENT_MORE_INFO_REQUESTED: 'More info requested',
  ASSIGNMENT_COMPLETED:       'Assignment completed',
  DOCTOR_REPLIED_TO_INFO_REQUEST: 'Doctor replied',
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const { cases, loading, refetch: refetchCases } = useCases();

  const isAdmin       = profile?.role === 'admin';
  const isDoctor      = profile?.role === 'doctor';
  const isRadiologist = profile?.role === 'radiologist';
  const canEditStatus = isAdmin || isDoctor || isRadiologist;

  // ── Stats ──
  const total       = cases.length;
  const pending     = cases.filter(c => c.status === 'pending' || c.status === 'processing').length;
  const aiComplete  = cases.filter(c => c.status === 'ai_complete').length;
  const highPriority = cases.filter(c => c.priority >= 3).length;
  const malignant   = cases.filter(c => c.ai_prediction === 'Malignant').length;

  const STATS = [
    { label: 'Active Studies',    value: total,        icon: FolderHeart,  chip: 'bg-medical-accent',     note: 'Patient cases in the current queue' },
    { label: 'Awaiting Review',   value: pending,      icon: Clock,        chip: 'bg-[var(--color-status-pending)]', note: 'Cases pending radiologist review' },
    { label: 'AI Analysis Ready', value: aiComplete,   icon: Zap,          chip: 'bg-[var(--color-status-ai-complete)]', note: 'AI triage completed' },
    { label: 'Urgent Findings',   value: highPriority, icon: AlertTriangle, chip: 'bg-medical-malignant', note: 'High-priority cases requiring rapid escalation' },
  ];

  const firstName = profile?.full_name?.split(' ').slice(0, 2).join(' ');
  const recentCases = cases.slice(0, 5);

  // ── Worklist (for display in left column) ──
  const WORKLIST_ORDER: Record<string, number> = { 'AI flagged': 0, 'Needs confirmation': 1, 'Awaiting review': 2 };
  const pendingReviews = cases
    .filter(c => ['pending', 'processing', 'ai_complete'].includes(c.status))
    .map(c => ({
      code:    c.case_code,
      patient: c.patient_alias ?? 'Unassigned patient',
      status:  c.status === 'ai_complete'
        ? (c.ai_prediction === 'Malignant' ? 'AI flagged' : 'Needs confirmation')
        : 'Awaiting review',
      time: formatDate(c.created_at),
    }))
    .sort((a, b) => WORKLIST_ORDER[a.status] - WORKLIST_ORDER[b.status])
    .slice(0, 5);

  // ── Reports ──
  const [reports, setReports]           = useState<MedicalReport[]>([]);
  const [doctorNames, setDoctorNames]   = useState<Record<string, string>>({});
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError]     = useState<string | null>(null);
  const [showAllReports, setShowAllReports] = useState(false);

  useEffect(() => {
    setReportsLoading(true);
    reportService.getRecentReports(showAllReports ? 50 : 5)
      .then(async data => {
        setReports(data);
        const names = await reportService.getDoctorNames(data.map(r => r.doctor_id));
        setDoctorNames(names);
      })
      .catch(err => setReportsError(err instanceof Error ? err.message : 'Failed to load reports.'))
      .finally(() => setReportsLoading(false));
  }, [showAllReports]);

  const visibleCaseIds = new Set(cases.map(c => c.id));
  const visibleReports = reports.filter(r =>
    isAdmin || r.doctor_id === profile?.id || visibleCaseIds.has(r.case_id)
  );
  const recentReports = visibleReports.map(r => {
    const linkedCase = cases.find(c => c.id === r.case_id);
    return {
      id:    r.id,
      title: `Report — ${linkedCase?.case_code ?? r.case_id.slice(0, 8)}`,
      type:  r.is_finalized ? 'Finalized · Signed' : 'Draft',
      owner: doctorNames[r.doctor_id] ?? 'Unknown doctor',
      time:  formatDate(r.created_at),
    };
  });

  // ── Audit Trail (admin only) ──
  const [auditLogs, setAuditLogs]     = useState<AuditLogEntry[]>([]);
  const [actorNames, setActorNames]   = useState<Record<string, string>>({});
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError]     = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) { setAuditLoading(false); return; }
    setAuditLoading(true);
    auditService.getRecentLogs(5)
      .then(async data => {
        setAuditLogs(data);
        const names = await getUserNamesByIds(data.map(l => l.user_id));
        setActorNames(names);
      })
      .catch(err => setAuditError(err instanceof Error ? err.message : 'Failed to load audit trail.'))
      .finally(() => setAuditLoading(false));
  }, [isAdmin]);

  const timeline = auditLogs.map(log => {
    const caseCode = typeof log.metadata?.case_code === 'string' ? log.metadata.case_code : null;
    const actor = actorNames[log.user_id] ?? 'Unknown user';
    return {
      title:  ACTION_LABELS[log.action] ?? log.action,
      detail: `${actor} · ${caseCode ? `Case ${caseCode}` : `${log.entity_type} · ${log.entity_id?.slice(0, 8) ?? '—'}`}`,
      time:   log.created_at ? `${formatDate(log.created_at)} · ${formatTime(log.created_at)}` : '—',
    };
  });

  return (
    <motion.div
      variants={container} initial="hidden" animate="show"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 overflow-x-hidden"
    >
      {/* Hero */}
      <motion.section variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-medical-accent">Breast Screening Operations</p>
            <h2 className="mt-2 text-2xl font-bold text-medical-text">
              Good {getTimeOfDay()}, {firstName || 'Radiology Team'}
            </h2>
            <p className="mt-1 text-sm text-medical-text/70">
              Review mammography studies, verify AI analysis, and prioritize radiologist sign-off across active screening cases.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-medical-text/60">
            <span className="rounded-full border border-medical-border bg-medical-bg px-3 py-1">Live screening queue</span>
            <span className="rounded-full border border-medical-border bg-medical-bg px-3 py-1">{cases.length} total cases</span>
            <span className="rounded-full border border-medical-border bg-medical-bg px-3 py-1">{malignant} malignant flags</span>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Stats */}
          <motion.div variants={item} className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {STATS.map(stat => (
              <article key={stat.label} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm transition-all hover:border-medical-primary/30 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-medical-text/50">
                      {stat.label}<InfoTooltip text={stat.note} />
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-medical-text">{loading ? '—' : stat.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm ${stat.chip}`}>
                    <stat.icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                </div>
              </article>
            ))}
          </motion.div>

          {/* Recent Cases */}
          <motion.article variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-1.5 text-base font-semibold text-medical-text">
                Recent Patient Cases<InfoTooltip text="Latest mammography studies, AI findings, and review status." />
              </h3>
              <Link to="/cases" className="inline-flex items-center gap-1 text-xs font-semibold text-medical-accent hover:gap-2">
                View all <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </Link>
            </div>
            {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-medical-border bg-medical-bg/60 text-medical-text/50">
                      {['Case Code', 'Patient', 'Status', 'AI Result', 'Date'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentCases.map(c => (
                      <tr key={c.id} className="border-b border-medical-border/50 last:border-0 hover:bg-medical-border/20">
                        <td className="px-3 py-3 font-mono text-xs font-semibold text-medical-accent">{c.case_code}</td>
                        <td className="px-3 py-3 text-medical-text/80">{c.patient_alias ?? '—'}</td>
                        <td className="px-3 py-3">
                          <StatusQuickEdit caseId={c.id} status={c.status} canEdit={canEditStatus} onChanged={() => refetchCases()} />
                        </td>
                        <td className={`px-3 py-3 text-xs font-bold ${c.ai_prediction ? PREDICTION_COLORS[c.ai_prediction] ?? '' : 'text-medical-text/30'}`}>
                          {c.ai_prediction ? `${c.ai_prediction}${c.ai_confidence ? ` (${(c.ai_confidence * 100).toFixed(0)}%)` : ''}` : '—'}
                        </td>
                        <td className="px-3 py-3 text-xs text-medical-text/50">{formatDate(c.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.article>

          {/* Worklist + Reports */}
          <motion.article variants={item} className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-1.5 text-base font-semibold text-medical-text">
                  Radiologist Worklist<InfoTooltip text="Cases awaiting interpretation or confirmation." />
                </h3>
              </div>
              {loading ? <div className="flex justify-center py-6"><Spinner /></div>
              : pendingReviews.length === 0
                ? <p className="py-6 text-center text-xs text-medical-text/50">No cases awaiting review.</p>
                : (
                  <div className="space-y-3">
                    {pendingReviews.map(entry => (
                      <article key={entry.code} className="rounded-xl border border-medical-border bg-medical-bg/70 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-medical-text truncate">{entry.code}</p>
                            <p className="text-xs text-medical-text/60 truncate">{entry.patient}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-medical-pending-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-medical-pending">
                            {entry.status}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] text-medical-text/50">{entry.time}</p>
                      </article>
                    ))}
                  </div>
                )}
            </section>

            <section className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-1.5 text-base font-semibold text-medical-text">
                  Recent Clinical Reports<InfoTooltip text="Latest finalized and draft mammography reports." />
                </h3>
                <button onClick={() => setShowAllReports(s => !s)} className="inline-flex items-center gap-1 text-xs font-semibold text-medical-accent hover:gap-2 transition-all">
                  {showAllReports ? 'Show less' : 'View all'} <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </div>
              {reportsLoading ? <div className="flex justify-center py-6"><Spinner /></div>
              : reportsError ? <p className="py-6 text-center text-xs text-medical-malignant">{reportsError}</p>
              : recentReports.length === 0 ? <p className="py-6 text-center text-xs text-medical-text/50">No clinical reports yet.</p>
              : (
                <div className="space-y-3">
                  {recentReports.map(report => (
                    <article key={report.id} className="rounded-xl border border-medical-border bg-medical-bg/70 p-3">
                      <p className="text-sm font-semibold text-medical-text">{report.title}</p>
                      <p className="mt-1 text-xs text-medical-text/60">{report.type} · {report.owner}</p>
                      <p className="mt-2 text-[11px] text-medical-text/50">{report.time}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </motion.article>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="space-y-6">
          {/* High priority */}
          <motion.article variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-1.5 text-base font-semibold text-medical-text">
                High Priority Findings<InfoTooltip text="Cases flagged for immediate follow-up or escalation." />
              </h3>
              <ShieldCheck className="h-4 w-4 text-medical-malignant" strokeWidth={2} />
            </div>
            {loading ? <div className="flex justify-center py-6"><Spinner /></div>
            : cases.filter(c => c.priority >= 3).length === 0
              ? <p className="py-6 text-center text-xs text-medical-text/50">No urgent findings right now.</p>
              : (
                <div className="space-y-3">
                  {cases.filter(c => c.priority >= 3).slice(0, 3).map(c => (
                    <article key={c.id} className="rounded-xl border border-medical-border bg-medical-bg/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-semibold text-medical-text">{c.case_code}</p>
                        <span className="shrink-0 rounded-full bg-medical-malignant-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-medical-malignant">Urgent</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-medical-text/60">
                        {c.patient_alias ?? 'Unassigned patient'} · {c.ai_prediction ?? 'AI result pending'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
          </motion.article>

          {/* Quick actions */}
          <motion.article variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-1.5 text-base font-semibold text-medical-text">
                Clinical Workflow Actions<InfoTooltip text="Direct paths to mammography upload, case creation, and report review." />
              </h3>
              <ScanSearch className="h-4 w-4 text-medical-accent" strokeWidth={2} />
            </div>
            <div className="space-y-2">
              {[
                { to: '/scans',   label: 'Upload Mammography Study', icon: Upload },
                { to: '/cases',   label: 'Open Screening Case',      icon: Plus },
                { to: '/reports', label: 'Review Reports',           icon: ClipboardList },
              ].map(action => (
                <Link key={action.to} to={action.to}
                  className="flex items-center justify-between rounded-xl border border-medical-border bg-medical-bg/70 px-3 py-3 text-sm text-medical-text hover:border-medical-primary/30 hover:bg-medical-border/30">
                  <span className="flex items-center gap-2">
                    <action.icon className="h-4 w-4" strokeWidth={2} />{action.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-medical-text/40" strokeWidth={2} />
                </Link>
              ))}
              {isRadiologist && (
                <Link to="/worklist"
                  className="flex items-center justify-between rounded-xl border border-medical-border bg-medical-bg/70 px-3 py-3 text-sm text-medical-text hover:border-medical-primary/30 hover:bg-medical-border/30">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" strokeWidth={2} /> My Worklist
                  </span>
                  <ArrowRight className="h-4 w-4 text-medical-text/40" strokeWidth={2} />
                </Link>
              )}
            </div>
          </motion.article>

          {/* ── CONDITIONAL BOTTOM WIDGET ── */}

          {/* Admin only: Audit Trail */}
          {isAdmin && (
            <motion.article variants={item} className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-1.5 text-base font-semibold text-medical-text">
                  Audit Trail<InfoTooltip text="Recent screening events recorded for traceability." />
                </h3>
                <Activity className="h-4 w-4 text-medical-accent" strokeWidth={2} />
              </div>
              {auditLoading ? <div className="flex justify-center py-6"><Spinner /></div>
              : auditError ? <p className="py-6 text-center text-xs text-medical-malignant">{auditError}</p>
              : timeline.length === 0 ? <p className="py-6 text-center text-xs text-medical-text/50">No recent activity recorded.</p>
              : (
                <div className="space-y-3 border-l border-medical-border pl-4">
                  {timeline.map((entry, idx) => (
                    <article key={idx} className="relative">
                      <span className="absolute left-[-1.05rem] top-1.5 h-2.5 w-2.5 rounded-full bg-medical-accent" />
                      <p className="text-sm font-semibold text-medical-text">{entry.title}</p>
                      <p className="text-xs text-medical-text/60">{entry.detail}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-medical-text/45">{entry.time}</p>
                    </article>
                  ))}
                </div>
              )}
            </motion.article>
          )}

          {/* Doctor: Assignment Activity Notifications */}
          {isDoctor && (
            <motion.article variants={item}>
              <ClinicalNotificationsWidget role="doctor" />
            </motion.article>
          )}

          {/* Radiologist: My Worklist Quick View */}
          {isRadiologist && (
            <motion.article variants={item}>
              <ClinicalNotificationsWidget role="radiologist" />
            </motion.article>
          )}
        </aside>
      </section>
    </motion.div>
  );
}