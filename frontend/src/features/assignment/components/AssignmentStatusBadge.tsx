import type { AssignmentStatus } from '../services/assignmentService';

// Uses only design system tokens from tokens.css
const CONFIG: Record<AssignmentStatus, { label: string; classes: string }> = {
  pending:             { label: 'Pending Review',   classes: 'bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending)] border-[var(--color-status-pending)]/30'       },
  accepted:            { label: 'In Review',         classes: 'bg-[var(--color-status-reviewed-bg)] text-[var(--color-status-reviewed)] border-[var(--color-status-reviewed)]/30'   },
  rejected:            { label: 'Rejected',          classes: 'bg-[var(--color-malignant-bg)] text-[var(--color-malignant)] border-[var(--color-malignant)]/30'                     },
  more_info_requested: { label: 'More Info Needed',  classes: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/30'                           },
  completed:           { label: 'Completed',         classes: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/30'                           },
};

export default function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
