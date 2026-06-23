import { getScopedQuery } from '../../../lib/supabaseClient';
import api from '../../../lib/api';

// Shape written by backend/app/routers/ai.py into the generated_report jsonb
// column. No dedicated columns exist for these fields in the live schema.
export interface GeneratedReport {
  probabilities?: Record<string, number>;
  threshold_used?: number;
  roi_source?: 'manual_roi' | 'center_crop_fallback';
  segmentation_mask_url?: string;
  model_metadata?: {
    image_size?: number;
    label_names?: string[];
    test_metrics?: Record<string, unknown>;
    roi_caveat?: string;
  };
}

export interface AIResult {
  id: string;
  case_id: string;
  scan_id: string;
  // Matches the deployed model's confirmed 2-class output (training
  // notebook: NUM_CLASSES=2, label_names = ["Benign","Malignant"]).
  // prediction_type DB enum updated to match (Normal/Suspicious removed).
  prediction: 'Benign' | 'Malignant';
  confidence: number;
  heatmap_url?: string;
  generated_report?: GeneratedReport;
  pipeline_version?: string;
  processing_ms?: number;
  created_at: string;
  updated_at?: string;
}

export interface ManualROI {
  roi_x: number;
  roi_y: number;
  roi_w: number;
  roi_h: number;
}

export const aiService = {
  async getResultByCaseId(caseId: string): Promise<AIResult | null> {
    const { data, error } = await getScopedQuery('ai_results')
      .select('*')
      .eq('case_id', caseId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to query inference intelligence diagnostics.');
    }
    return data;
  },

  // Triggers a real analysis run: backend downloads the scan, calls the
  // medguard-inference service, uploads results to Storage, and writes a
  // new ai_results row. Routed through the backend (not direct Supabase)
  // since this is an orchestration step involving an external service call.
  async analyzeCase(scanId: string, roi?: ManualROI): Promise<AIResult> {
    const { data } = await api.post<AIResult>(`/api/ai/analyze/${scanId}`, {
      roi: roi ?? null,
    });
    return data;
  },
};