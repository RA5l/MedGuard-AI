export type CaseStatus =
  | 'pending'
  | 'processing'
  | 'ai_complete'
  | 'reviewed'
  | 'reported'
  | 'archived';

export interface Case {
  id: string;
  case_code: string;
  patient_alias: string;
  status: CaseStatus;
  priority: number;
  notes: string;
  created_at: string;
  // AI result fields — populated after analysis.
  ai_prediction?: string;
  ai_confidence?: number;
  // Fields from database view / joined query.
  total_scans?: number;
  assigned_doctor_id?: string;
  assigned_doctor_name?: string;
  created_by?: string;
}

export interface CreateCasePayload {
  case_code: string;
  patient_alias: string;
  priority: number;
  notes: string;
}
