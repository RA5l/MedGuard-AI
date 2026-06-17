import {
  Clock,
  Loader2,
  Zap,
  CheckCircle,
  FileText,
  Archive,
  Stethoscope,
  ScanLine,
  ShieldCheck,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import type { ElementType } from 'react';

// ---------------------------------------------------------------------------
// Status config
// Keys match the `status` field on the `cases` table.
// ---------------------------------------------------------------------------

interface StatusConfig {
  label: string;
  classes: string;
  icon?: ElementType;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    classes:
      'bg-(--color-medical-pending-soft) text-(--color-medical-pending) border border-(--color-medical-pending)/30',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    classes:
      'bg-(--color-medical-processing-soft) text-(--color-medical-processing) border border-(--color-medical-processing)/30 animate-pulse',
  },
  ai_complete: {
    label: 'AI Complete',
    icon: Zap,
    classes:
      'bg-(--color-medical-ai-complete-soft) text-(--color-medical-ai-complete) border border-(--color-medical-ai-complete)/30',
  },
  reviewed: {
    label: 'Reviewed',
    icon: CheckCircle,
    classes:
      'bg-(--color-medical-reviewed-soft) text-(--color-medical-reviewed) border border-(--color-medical-reviewed)/30',
  },
  reported: {
    label: 'Report Issued',
    icon: FileText,
    classes:
      'bg-(--color-medical-reported-soft) text-(--color-medical-reported) border border-(--color-medical-reported)/30',
  },
  archived: {
    label: 'Archived',
    icon: Archive,
    classes:
      'bg-(--color-medical-archived-soft) text-(--color-medical-archived) border border-(--color-medical-archived)/30',
  },
};

// ---------------------------------------------------------------------------
// Priority config
// Keys 0–3 match form values in CasesListPage (0 = Routine, 3 = Urgent).
// ---------------------------------------------------------------------------

interface PriorityConfig {
  label: string;
  color: string;
  bg: string;
  icon?: ElementType;
}

export const PRIORITY_CONFIG: Record<number, PriorityConfig> = {
  0: {
    label: 'Routine',
    icon: Minus,
    color: 'text-(--color-medical-priority-routine)',
    bg: 'bg-(--color-medical-priority-routine)/10',
  },
  1: {
    label: 'Low',
    color: 'text-(--color-medical-priority-low)',
    bg: 'bg-(--color-medical-priority-low)/10',
  },
  2: {
    label: 'High',
    icon: AlertTriangle,
    color: 'text-(--color-medical-priority-high)',
    bg: 'bg-(--color-medical-priority-high)/10',
  },
  3: {
    label: 'Urgent',
    icon: AlertTriangle,
    color: 'text-(--color-medical-priority-urgent)',
    bg: 'bg-(--color-medical-priority-urgent)/10',
  },
};

// ---------------------------------------------------------------------------
// Role config
// Used by Navbar badge and AdminPanel role column.
// ---------------------------------------------------------------------------

interface RoleConfig {
  label: string;
  classes: string;
  icon?: ElementType;
}

export const ROLE_CONFIG: Record<string, RoleConfig> = {
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    classes:
      'bg-(--color-medical-role-admin-soft) text-(--color-medical-role-admin) border border-(--color-medical-role-admin)/30',
  },
  doctor: {
    label: 'Doctor',
    icon: Stethoscope,
    classes:
      'bg-(--color-medical-role-doctor-soft) text-(--color-medical-role-doctor) border border-(--color-medical-role-doctor)/30',
  },
  radiologist: {
    label: 'Radiologist',
    icon: ScanLine,
    classes:
      'bg-(--color-medical-role-radiologist-soft) text-(--color-medical-role-radiologist) border border-(--color-medical-role-radiologist)/30',
  },
};

// ---------------------------------------------------------------------------
// Active/Inactive status classes
// Used in AdminPanel user table.
// ---------------------------------------------------------------------------

export const ACTIVE_STATUS_CLASSES = {
  active:
    'bg-(--color-medical-normal-soft) text-(--color-medical-normal) border border-(--color-medical-normal)/30',
  inactive:
    'bg-(--color-medical-malignant-soft) text-(--color-medical-malignant) border border-(--color-medical-malignant)/30',
};

// ---------------------------------------------------------------------------
// AI prediction text colors
// Applied to the AI result column in cases and dashboard tables.
// ---------------------------------------------------------------------------

export const PREDICTION_COLORS: Record<string, string> = {
  Malignant:  'text-(--color-medical-malignant)',
  Benign:     'text-(--color-medical-normal)',
  Suspicious: 'text-(--color-medical-benign)',
};
