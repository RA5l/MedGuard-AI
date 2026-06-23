import { useState } from 'react';
import {
  UserCheck, MessageSquare, CheckCircle2, XCircle,
  Loader2, Clock, AlertTriangle, Send,
} from 'lucide-react';
import { assignmentService } from '../services/assignmentService';
import type { CaseAssignment } from '../services/assignmentService';
import AssignmentStatusBadge from './AssignmentStatusBadge';
import { formatDate } from '../../../utils/date';

interface Props {
  assignment: CaseAssignment;
  role: 'doctor' | 'radiologist' | 'admin';
  onUpdated: () => void;
}

export default function AssignmentPanel({ assignment, role, onUpdated }: Props) {
  const [responding, setResponding]       = useState(false);
  const [reasonInput, setReasonInput]     = useState('');
  const [replyInput, setReplyInput]       = useState('');
  const [showReasonFor, setShowReasonFor] = useState<'rejected' | 'more_info_requested' | null>(null);
  const [showDoctorReply, setShowDoctorReply] = useState(false);
  const [error, setError] = useState('');

  const respond = async (
    status: 'accepted' | 'rejected' | 'more_info_requested',
    reason?: string,
  ) => {
    setResponding(true);
    setError('');
    try {
      await assignmentService.respond(assignment.id, status, reason);
      setShowReasonFor(null);
      setReasonInput('');
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setResponding(false);
    }
  };

  // Doctor replies to more_info_requested — resets assignment to pending
  const sendDoctorReply = async () => {
    if (!replyInput.trim()) return;
    setResponding(true);
    setError('');
    try {
      await assignmentService.doctorReply(assignment.id, replyInput.trim());
      setShowDoctorReply(false);
      setReplyInput('');
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reply.');
    } finally {
      setResponding(false);
    }
  };

  const complete = async () => {
    setResponding(true);
    setError('');
    try {
      await assignmentService.complete(assignment.id, assignment.case_id);
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setResponding(false);
    }
  };

  // Issue A fix: radiologist actions visible in BOTH pending AND more_info_requested
  const radiologistCanAct =
    role === 'radiologist' &&
    (assignment.status === 'pending' || assignment.status === 'more_info_requested');

  // Issue B fix: doctor can assign/re-assign when rejected OR more_info_requested OR no assignment
  // (this flag is consumed by CaseDetailsPage, exposed here for convenience)
  const doctorShouldReassign =
    role === 'doctor' &&
    (assignment.status === 'rejected' || assignment.status === 'more_info_requested');

  return (
    <div className="bg-medical-surface border border-medical-border rounded-xl p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-medical-accent" strokeWidth={2} />
          <span className="text-sm font-bold text-medical-text">Radiologist Assignment</span>
        </div>
        <AssignmentStatusBadge status={assignment.status} />
      </div>

      {/* Info rows */}
      <div className="space-y-1.5 text-xs text-medical-text/60">
        {assignment.assigned_to_name && (
          <p>Radiologist: <span className="font-semibold text-medical-text">{assignment.assigned_to_name}</span></p>
        )}
        {assignment.assigned_by_name && (
          <p>Assigned by: <span className="font-semibold text-medical-text">{assignment.assigned_by_name}</span></p>
        )}
        <p className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Sent {formatDate(assignment.assigned_at)}
        </p>
        {assignment.responded_at && (
          <p>Responded {formatDate(assignment.responded_at)}</p>
        )}
      </div>

      {/* Rejection reason */}
      {assignment.status === 'rejected' && assignment.decision_reason && (
        <div className="p-3 rounded-lg border"
          style={{
            backgroundColor: 'var(--color-malignant-bg)',
            borderColor: 'color-mix(in srgb, var(--color-malignant) 30%, transparent)',
          }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-malignant)' }}>
            Rejection Reason
          </p>
          <p className="text-xs text-medical-text/70">{assignment.decision_reason}</p>
        </div>
      )}

      {/* More info reason + doctor reply trigger */}
      {assignment.status === 'more_info_requested' && assignment.decision_reason && (
        <div className="p-3 rounded-lg border space-y-2"
          style={{
            backgroundColor: 'var(--color-warning-bg)',
            borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
          }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-warning)' }}>
            Radiologist requested additional information
          </p>
          <p className="text-xs text-medical-text/70">{assignment.decision_reason}</p>

          {/* Issue C: Doctor reply */}
          {role === 'doctor' && !showDoctorReply && (
            <button
              onClick={() => setShowDoctorReply(true)}
              className="flex items-center gap-1.5 text-xs font-semibold mt-1 transition-opacity hover:opacity-80"
              style={{ color: 'var(--color-primary)' }}
            >
              <Send className="w-3 h-3" strokeWidth={2.5} /> Reply to Radiologist
            </button>
          )}
        </div>
      )}

      {/* Doctor reply input — Issue C */}
      {showDoctorReply && role === 'doctor' && (
        <div className="space-y-2 p-3 rounded-lg border border-medical-border bg-medical-bg">
          <label className="block text-xs font-medium text-medical-text/60">
            Your reply to the radiologist
          </label>
          <textarea
            value={replyInput}
            onChange={e => setReplyInput(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-medical-border bg-medical-surface text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-accent/30 resize-none"
            placeholder="e.g. The RMLO view has been uploaded. Please check scan #3…"
          />
          <div className="flex gap-2">
            <button
              onClick={sendDoctorReply}
              disabled={responding || !replyInput.trim()}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-40 transition-all"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
            >
              {responding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" strokeWidth={2.5} />}
              Send Reply
            </button>
            <button
              onClick={() => { setShowDoctorReply(false); setReplyInput(''); }}
              className="text-xs text-medical-text/50 px-3 py-1.5 rounded-lg border border-medical-border hover:bg-medical-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Doctor reply info — shown after reply is sent (status back to pending) */}
      {assignment.status === 'pending' && assignment.doctor_reply && (
        <div className="p-3 rounded-lg border border-medical-border bg-medical-bg/60">
          <p className="text-xs font-semibold text-medical-text/60 mb-1">Doctor replied</p>
          <p className="text-xs text-medical-text/80">{assignment.doctor_reply}</p>
        </div>
      )}

      {/* Radiologist reason input */}
      {showReasonFor && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-medical-text/60">
            {showReasonFor === 'rejected'
              ? 'Rejection reason (required)'
              : 'What additional info is needed?'}
          </label>
          <textarea
            value={reasonInput}
            onChange={e => setReasonInput(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-medical-border bg-medical-bg text-medical-text text-sm outline-none focus:ring-2 focus:ring-medical-accent/30 resize-none"
            placeholder={
              showReasonFor === 'rejected'
                ? 'e.g. Case outside my specialty…'
                : 'e.g. Please upload the RMLO view…'
            }
          />
          <div className="flex gap-2">
            <button
              onClick={() => respond(showReasonFor, reasonInput)}
              disabled={responding || !reasonInput.trim()}
              className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
            >
              {responding && <Loader2 className="w-3 h-3 animate-spin" />} Confirm
            </button>
            <button
              onClick={() => { setShowReasonFor(null); setReasonInput(''); }}
              className="text-xs text-medical-text/50 px-3 py-1.5 rounded-lg border border-medical-border hover:bg-medical-bg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-error)' }}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* Issue A fix: radiologist buttons visible in pending AND more_info_requested */}
      {radiologistCanAct && !showReasonFor && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-medical-border">
          <button
            onClick={() => respond('accepted')}
            disabled={responding}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-text-inverse)' }}
          >
            {responding
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            }
            Accept
          </button>

          <button
            onClick={() => setShowReasonFor('rejected')}
            disabled={responding}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-malignant)', color: 'var(--color-text-inverse)' }}
          >
            <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} /> Reject
          </button>

          {/* Only show "Request More Info" if not already in that state */}
          {assignment.status !== 'more_info_requested' && (
            <button
              onClick={() => setShowReasonFor('more_info_requested')}
              disabled={responding}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-medical-border text-medical-text/70 hover:bg-medical-bg transition-colors disabled:opacity-40"
            >
              <MessageSquare className="w-3.5 h-3.5" strokeWidth={2} /> Request More Info
            </button>
          )}
        </div>
      )}

      {/* Radiologist: mark completed when accepted */}
      {role === 'radiologist' && assignment.status === 'accepted' && !showReasonFor && (
        <div className="pt-1 border-t border-medical-border">
          <button
            onClick={complete}
            disabled={responding}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
          >
            {responding
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
            }
            Mark as Completed
          </button>
        </div>
      )}

      {/* Issue B: doctor re-assign hint — actual button lives in CaseDetailsPage */}
      {doctorShouldReassign && (
        <p className="text-xs text-medical-text/50 pt-1 border-t border-medical-border">
          Use the <span className="font-semibold text-medical-text/70">Re-assign</span> button above to send this case to another radiologist.
        </p>
      )}
    </div>
  );
}