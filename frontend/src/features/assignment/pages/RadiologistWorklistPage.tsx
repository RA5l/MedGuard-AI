import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, AlertCircle, Inbox, ArrowRight } from 'lucide-react';
import { useWorklist } from '../hooks/useAssignment';
import { assignmentService } from '../services/assignmentService';
import AssignmentStatusBadge from '../components/AssignmentStatusBadge';
import { caseService } from '../../cases/services/caseService';
import type { Case } from '../../cases/types';
import Spinner from '../../../components/Spinner';
import { formatDate } from '../../../utils/date';

interface WorklistRow {
  assignment: import('../services/assignmentService').CaseAssignment;
  caseData: Case | null;
}

export default function RadiologistWorklistPage() {
  const navigate = useNavigate();
  const { worklist, loading, error, reload } = useWorklist();
  const [rows, setRows] = useState<WorklistRow[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // Enrich assignments with case data
  useEffect(() => {
    if (!worklist.length) { setRows([]); return; }
    setLoadingCases(true);
    Promise.all(
      worklist.map(async a => {
        try {
          const caseData = await caseService.getCaseById(a.case_id);
          return { assignment: a, caseData };
        } catch {
          return { assignment: a, caseData: null };
        }
      })
    ).then(setRows).finally(() => setLoadingCases(false));
  }, [worklist]);

  const handleRespond = async (
    assignmentId: string,
    status: 'accepted' | 'rejected',
    caseId: string,
  ) => {
    try {
      await assignmentService.respond(assignmentId, status);
      reload();
      if (status === 'accepted') navigate(`/cases/${caseId}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-medical-primary/10 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-medical-primary" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-medical-text tracking-tight">My Worklist</h2>
          <p className="text-medical-text/40 text-sm">Cases assigned to you for radiological review.</p>
        </div>
      </div>

      {/* Content */}
      {loading || loadingCases ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-medical-text/40">
          <Inbox className="w-10 h-10 mb-3 opacity-40" strokeWidth={1.5} />
          <p className="text-sm font-medium">No pending assignments.</p>
          <p className="text-xs mt-1 text-medical-text/30">Cases assigned to you will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ assignment, caseData }) => (
            <div
              key={assignment.id}
              className="bg-medical-surface border border-medical-border rounded-2xl p-5 space-y-4"
            >
              {/* Case header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-medical-primary text-sm">
                      {caseData?.case_code ?? assignment.case_id.slice(0, 8)}
                    </span>
                    {caseData?.patient_alias && (
                      <span className="text-xs text-medical-text/50">· {caseData.patient_alias}</span>
                    )}
                  </div>
                  <p className="text-xs text-medical-text/40">
                    Assigned {formatDate(assignment.assigned_at)}
                  </p>
                </div>
                <AssignmentStatusBadge status={assignment.status} />
              </div>

              {/* Rejection reason */}
              {assignment.status === 'rejected' && assignment.decision_reason && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                  <span className="font-semibold">Reason: </span>{assignment.decision_reason}
                </div>
              )}

              {/* More info reason */}
              {assignment.status === 'more_info_requested' && assignment.decision_reason && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-400">
                  <span className="font-semibold">Info needed: </span>{assignment.decision_reason}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-medical-border">
                {assignment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleRespond(assignment.id, 'accepted', assignment.case_id)}
                      className="text-xs font-bold bg-green-600 text-white px-3 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespond(assignment.id, 'rejected', assignment.case_id)}
                      className="text-xs font-bold bg-red-600/80 text-white px-3 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                      Reject
                    </button>
                  </>
                )}

                {assignment.status === 'accepted' && (
                  <button
                    onClick={() => navigate(`/cases/${assignment.case_id}`)}
                    className="text-xs font-bold bg-medical-primary text-white px-3 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    Open Case <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                )}

                <button
                  onClick={() => navigate(`/cases/${assignment.case_id}`)}
                  className="text-xs font-medium text-medical-text/50 px-3 py-2 rounded-lg border border-medical-border hover:bg-medical-bg transition-colors flex items-center gap-1.5"
                >
                  View Case <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
