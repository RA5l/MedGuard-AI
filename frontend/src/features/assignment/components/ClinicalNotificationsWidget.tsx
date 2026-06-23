import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellRing, CheckCircle2, XCircle, MessageSquare,
  ArrowRight, ClipboardList, Loader2, Inbox,
} from 'lucide-react';
import { assignmentService } from '../services/assignmentService';
import type { CaseAssignment, AssignmentStatus } from '../services/assignmentService';
import { getScopedQuery } from '../../../lib/supabaseClient';
import { formatDate } from '../../../utils/date';
import InfoTooltip from '../../../components/InfoTooltip';

interface EnrichedActivity extends CaseAssignment {
  caseCode?: string;
}

const STATUS_CFG: Partial<Record<AssignmentStatus, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
}>> = {
  accepted: {
    icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />,
    label: 'Accepted',
    color: 'var(--color-success)',
    bg:    'var(--color-success-bg)',
  },
  rejected: {
    icon: <XCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />,
    label: 'Rejected',
    color: 'var(--color-malignant)',
    bg:    'var(--color-malignant-bg)',
  },
  more_info_requested: {
    icon: <MessageSquare className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />,
    label: 'Info Requested',
    color: 'var(--color-warning)',
    bg:    'var(--color-warning-bg)',
  },
  completed: {
    icon: <ClipboardList className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />,
    label: 'Completed',
    color: 'var(--color-status-reported)',
    bg:    'var(--color-status-reported-bg)',
  },
};

interface Props {
  /** 'doctor' sees activity from cases they assigned.
   *  'radiologist' sees their own worklist pending items. */
  role: 'doctor' | 'radiologist';
}

export default function ClinicalNotificationsWidget({ role }: Props) {
  const navigate = useNavigate();
  const [items, setItems]     = useState<EnrichedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    const fetch = role === 'doctor'
      ? assignmentService.getMyRecentActivity()
      : assignmentService.getMyWorklist();

    fetch
      .then(async assignments => {
        // Enrich with case_code
        const enriched = await Promise.all(
          assignments.map(async a => {
            try {
              const { data } = await getScopedQuery('cases')
                .select('case_code')
                .eq('id', a.case_id)
                .single();
              return { ...a, caseCode: data?.case_code };
            } catch {
              return { ...a, caseCode: undefined };
            }
          })
        );
        setItems(enriched);
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, [role]);

  return (
    <article className="rounded-2xl border border-medical-border bg-medical-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-medical-text">
          {role === 'doctor' ? 'Assignment Activity' : 'My Worklist'}
          <InfoTooltip text={
            role === 'doctor'
              ? 'Recent responses from radiologists on cases you assigned.'
              : 'Cases currently assigned to you awaiting your action.'
          } />
        </h3>
        <BellRing className="h-4 w-4 text-medical-accent" strokeWidth={2} />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-medical-accent" />
        </div>
      ) : error ? (
        <p className="py-6 text-center text-xs text-medical-malignant">{error}</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center text-medical-text/40">
          <Inbox className="w-7 h-7 mb-2 opacity-40" strokeWidth={1.5} />
          <p className="text-xs">
            {role === 'doctor'
              ? 'No recent assignment responses.'
              : 'No pending assignments in your worklist.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const cfg = STATUS_CFG[item.status];
            if (!cfg) return null;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/cases/${item.case_id}`)}
                className="w-full text-left rounded-xl border border-medical-border bg-medical-bg/70 p-3 hover:border-medical-primary/30 hover:bg-medical-border/20 transition-all group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Status icon chip */}
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {cfg.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-medical-text truncate">
                        {item.caseCode
                          ? <span className="font-mono">{item.caseCode}</span>
                          : <span className="text-medical-text/50">{item.case_id.slice(0, 8)}</span>
                        }
                      </p>
                      <p className="text-[11px] text-medical-text/50 truncate">
                        {cfg.label}
                        {item.decision_reason && (
                          <span className="ml-1">· {item.decision_reason.slice(0, 40)}{item.decision_reason.length > 40 ? '…' : ''}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-medical-text/30 group-hover:text-medical-primary shrink-0 transition-colors" strokeWidth={2} />
                </div>
                <p className="mt-1.5 text-[11px] text-medical-text/40 ml-8">
                  {formatDate(item.updated_at ?? item.created_at)}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {role === 'radiologist' && items.length > 0 && (
        <button
          onClick={() => navigate('/worklist')}
          className="mt-3 w-full text-center text-xs font-semibold text-medical-accent hover:opacity-80 transition-opacity flex items-center justify-center gap-1"
        >
          Open Full Worklist <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      )}
    </article>
  );
}