export const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  pending: { label: 'Pending Review', color: 'text-status-pending', bgColor: 'bg-status-pending/10', dotColor: 'bg-status-pending' },
  processing: { label: 'Processing', color: 'text-status-processing', bgColor: 'bg-status-processing/10', dotColor: 'bg-status-processing' },
  ai_complete: { label: 'AI Complete', color: 'text-ai-complete', bgColor: 'bg-ai-complete/10', dotColor: 'bg-ai-complete' },
  reviewed: { label: 'Reviewed', color: 'text-status-reviewed', bgColor: 'bg-status-reviewed/10', dotColor: 'bg-status-reviewed' },
  reported: { label: 'Reported', color: 'text-status-reported', bgColor: 'bg-status-reported/10', dotColor: 'bg-status-reported' },
  archived: { label: 'Archived', color: 'text-status-archived', bgColor: 'bg-status-archived/10', dotColor: 'bg-status-archived' },
};

export const PRIORITY_CONFIG: Record<number, { label: string; color: string; bgColor: string }> = {
  0: { label: 'Routine', color: 'text-priority-routine', bgColor: 'bg-priority-routine/10' },
  1: { label: 'Low', color: 'text-priority-low', bgColor: 'bg-priority-low/10' },
  2: { label: 'High', color: 'text-priority-high', bgColor: 'bg-priority-high/10' },
  3: { label: 'Urgent', color: 'text-priority-urgent', bgColor: 'bg-priority-urgent/10' },
};

export const ROLE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  admin: { label: 'Admin', color: 'text-role-admin', bgColor: 'bg-role-admin/10' },
  doctor: { label: 'Doctor', color: 'text-role-doctor', bgColor: 'bg-role-doctor/10' },
  radiologist: { label: 'Radiologist', color: 'text-role-radiologist', bgColor: 'bg-role-radiologist/10' },
};

export const PREDICTION_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  malignant: { label: 'Malignant', color: 'text-malignant', bgColor: 'bg-malignant/10' },
  benign: { label: 'Benign', color: 'text-benign', bgColor: 'bg-benign/10' },
  suspicious: { label: 'Suspicious', color: 'text-suspicious', bgColor: 'bg-suspicious/10' },
  'no result': { label: 'No Result', color: 'text-no-result', bgColor: 'bg-no-result/10' },
};
