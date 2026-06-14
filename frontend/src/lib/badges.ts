import {
  Clock,
  Loader2,
  Sparkles,
  Eye,
  CheckCircle2,
  Archive,
  Minus,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  ScanLine,
  type LucideIcon,
} from 'lucide-react';

// Table/list badges — soft tints, accessible (WCAG AA) in both themes.
export const STATUS_CONFIG: Record<string, { label: string; icon: LucideIcon; classes: string; solid: string }> = {
  pending:     { label: 'Pending',     icon: Clock,        classes: 'bg-(--color-medical-pending-soft) text-(--color-medical-pending)',         solid: 'bg-(--color-medical-pending)' },
  processing:  { label: 'Processing',  icon: Loader2,      classes: 'bg-(--color-medical-processing-soft) text-(--color-medical-processing)',     solid: 'bg-(--color-medical-processing)' },
  ai_complete: { label: 'AI Complete', icon: Sparkles,     classes: 'bg-(--color-medical-ai-complete-soft) text-(--color-medical-ai-complete)',    solid: 'bg-(--color-medical-ai-complete)' },
  reviewed:    { label: 'Reviewed',    icon: Eye,          classes: 'bg-(--color-medical-reviewed-soft) text-(--color-medical-reviewed)',          solid: 'bg-(--color-medical-reviewed)' },
  reported:    { label: 'Reported',    icon: CheckCircle2, classes: 'bg-(--color-medical-reported-soft) text-(--color-medical-reported)',          solid: 'bg-(--color-medical-reported)' },
  archived:    { label: 'Archived',    icon: Archive,      classes: 'bg-(--color-medical-archived-soft) text-(--color-medical-archived)',          solid: 'bg-(--color-medical-archived)' },
};

export const PRIORITY_CONFIG: Record<number, { label: string; icon: LucideIcon; color: string }> = {
  0: { label: 'Routine', icon: Minus,        color: 'text-(--color-medical-priority-routine)' },
  1: { label: 'Low',     icon: ArrowDown,    color: 'text-(--color-medical-priority-low)' },
  2: { label: 'High',    icon: ArrowUp,      color: 'text-(--color-medical-priority-high)' },
  3: { label: 'Urgent',  icon: AlertTriangle, color: 'text-(--color-medical-priority-urgent)' },
};

export const PREDICTION_COLORS: Record<string, string> = {
  Normal:    'text-medical-normal',
  Benign:    'text-medical-benign',
  Malignant: 'text-medical-malignant',
};

export const ROLE_CONFIG: Record<string, { label: string; icon: LucideIcon; classes: string; solid: string }> = {
  admin:       { label: 'Admin',       icon: ShieldCheck, classes: 'bg-(--color-medical-role-admin-soft) text-(--color-medical-role-admin)',             solid: 'bg-(--color-medical-role-admin)' },
  doctor:      { label: 'Doctor',      icon: Stethoscope, classes: 'bg-(--color-medical-role-doctor-soft) text-(--color-medical-role-doctor)',            solid: 'bg-(--color-medical-role-doctor)' },
  radiologist: { label: 'Radiologist', icon: ScanLine,    classes: 'bg-(--color-medical-role-radiologist-soft) text-(--color-medical-role-radiologist)',  solid: 'bg-(--color-medical-role-radiologist)' },
};

export const ACTIVE_STATUS_CLASSES = {
  active:   'bg-(--color-medical-normal-soft) text-medical-normal',
  inactive: 'bg-(--color-medical-malignant-soft) text-medical-malignant',
};