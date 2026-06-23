import { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, MessageSquare, X } from 'lucide-react';
import type { AssignmentStatus } from '../services/assignmentService';

export interface ToastMessage {
  id: string;
  status: AssignmentStatus;
  caseId: string;
  caseCode?: string;
}

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const TOAST_CONFIG: Partial<Record<AssignmentStatus, {
  icon: React.ReactNode;
  title: string;
  bg: string;
  border: string;
  text: string;
}>> = {
  accepted: {
    icon: <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2.5} />,
    title: 'Assignment Accepted',
    bg: 'var(--color-success-bg)',
    border: 'var(--color-success)',
    text: 'var(--color-success)',
  },
  rejected: {
    icon: <XCircle className="w-4 h-4 shrink-0" strokeWidth={2.5} />,
    title: 'Assignment Rejected',
    bg: 'var(--color-malignant-bg)',
    border: 'var(--color-malignant)',
    text: 'var(--color-malignant)',
  },
  more_info_requested: {
    icon: <MessageSquare className="w-4 h-4 shrink-0" strokeWidth={2.5} />,
    title: 'More Information Requested',
    bg: 'var(--color-warning-bg)',
    border: 'var(--color-warning)',
    text: 'var(--color-warning)',
  },
};

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const cfg = TOAST_CONFIG[toast.status];
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  if (!cfg) return null;

  return (
    <div
      className="flex items-start gap-3 w-80 p-4 rounded-xl border shadow-lg backdrop-blur-sm pointer-events-auto"
      style={{
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
        color: cfg.text,
      }}
    >
      {cfg.icon}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold">{cfg.title}</p>
        {toast.caseCode && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            Case <span className="font-mono font-semibold">{toast.caseCode}</span>
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

export default function AssignmentToastContainer({ toasts, onDismiss }: Props) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}
