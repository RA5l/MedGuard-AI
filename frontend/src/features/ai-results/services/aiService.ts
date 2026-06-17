import { getScopedQuery } from '../../../lib/supabaseClient';

export interface AIResult {
  id: string;
  case_id: string;
  prediction: 'normal' | 'benign' | 'malignant';
  confidence: number;
  heatmap_url?: string;
  findings_summary: string;
  created_at: string;
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
  }
};