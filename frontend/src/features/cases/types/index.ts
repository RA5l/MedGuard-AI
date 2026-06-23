export type CaseStatus =
  | 'pending' | 'processing' | 'ai_complete'
  | 'assigned' | 'in_review' | 'rejected'   
  | 'reviewed' | 'reported' | 'archived';

export interface Case {
  id: string;
  case_code: string;
  patient_alias: string;
  status: CaseStatus;
  priority: number;
  // NOT part of v_case_dashboard's actual columns (confirmed via Supabase
  // API docs) - merged in separately from the raw `cases` table by
  // caseService (see mergeRawFields). Will be '' if that merge ever fails.
  notes: string;
  created_at: string;
  updated_at?: string;
  // AI result fields — populated after analysis.
  ai_prediction?: string;
  ai_confidence?: number;
  ai_heatmap_url?: string;
  final_birads?: string;
  // Fields from database view / joined query.
  total_scans?: number;
  // NOT part of v_case_dashboard's actual columns either - same
  // merge-from-raw-table situation as notes above. Needed for role-based
  // visibility filtering (useCases.ts), which can't rely on display names.
  assigned_doctor_id?: string;
  created_by?: string;
  deleted_at?: string | null;
  assigned_doctor_name?: string;
  assigned_doctor_email?: string;
  assigned_doctor_specialty?: string;
  created_by_name?: string;
  report_finalized?: boolean;
}

export interface CreateCasePayload {
  case_code: string;
  patient_alias: string;
  priority: number;
  notes: string;
}

export interface UpdateCasePayload {
  patient_alias?: string;
  notes?: string;
  status?: CaseStatus;
  priority?: number;
}
