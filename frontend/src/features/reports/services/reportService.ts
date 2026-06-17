import { getScopedQuery, supabase } from '../../../lib/supabaseClient';

export interface MedicalReport {
  id: string;
  case_id: string;
  author_id: string;
  report_text: string;
  birads_category: string;
  is_signed: boolean;
  signed_at?: string;
  created_at: string;
}

export const reportService = {
  async getReportByCaseId(caseId: string): Promise<MedicalReport | null> {
    const { data, error } = await getScopedQuery('reports')
      .select('*')
      .eq('case_id', caseId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Failed to pull authenticated clinical assessment forms.');
    }
    return data;
  },

  async createReport(caseId: string, reportText: string, birads: string): Promise<MedicalReport> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Unauthenticated interface context verification error.');

    const { data, error } = await getScopedQuery('reports')
      .insert({
        case_id: caseId,
        author_id: session.user.id,
        report_text: reportText,
        birads_category: birads,
        is_signed: true,
        signed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to sign and securely commit clinical declaration ledger.');
    }
    return data;
  }
};