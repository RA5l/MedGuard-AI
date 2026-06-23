import { getScopedQuery, supabase } from '../../../lib/supabaseClient';
import { getUserNamesByIds } from '../../../lib/userLookup';
import { logAudit } from '../../../lib/auditLog';
import { caseService } from '../../cases/services/caseService';

export interface MedicalReport {
  id: string;
  case_id: string;
  doctor_id: string;
  bi_rads: string;
  final_recommendation: string;
  findings?: string;
  impression?: string;
  recommendation?: string;
  breast_density?: string;
  doctor_notes?: string;
  pdf_path?: string;
  is_finalized: boolean;
  finalized_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface SaveReportPayload {
  caseId: string;
  biRads: string;
  finalRecommendation: string;
  findings?: string;
  impression?: string;
  recommendation?: string;
  breastDensity?: string;
  doctorNotes?: string;
  isFinalized: boolean;
}

export const reportService = {
  async getRecentReports(limit = 5, doctorId?: string): Promise<MedicalReport[]> {
    let query = getScopedQuery('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message || 'Failed to load recent clinical reports.');
    return data || [];
  },

  async getDoctorNames(doctorIds: string[]): Promise<Record<string, string>> {
    return getUserNamesByIds(doctorIds);
  },

  async getReportByCaseId(caseId: string): Promise<MedicalReport | null> {
    const { data, error } = await getScopedQuery('reports')
      .select('*')
      .eq('case_id', caseId)
      .maybeSingle();

    if (error) throw new Error(error.message || 'Failed to pull authenticated clinical assessment forms.');
    return data;
  },

  async createReport(payload: SaveReportPayload): Promise<MedicalReport> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');

    const { data, error } = await getScopedQuery('reports')
      .insert({
        case_id:              payload.caseId,
        doctor_id:            session.user.id,
        bi_rads:              payload.biRads,
        final_recommendation: payload.finalRecommendation,
        findings:             payload.findings    || null,
        impression:           payload.impression  || null,
        recommendation:       payload.recommendation || null,
        breast_density:       payload.breastDensity  || null,
        doctor_notes:         payload.doctorNotes || null,
        is_finalized:         payload.isFinalized,
        finalized_at:         payload.isFinalized ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message || 'Failed to save report.');

    await logAudit(session.user.id, 'REPORT_CREATED', 'reports', data.id, {
      case_id: payload.caseId, bi_rads: payload.biRads, is_finalized: payload.isFinalized,
    });
    await caseService.bumpStatusForward(payload.caseId, payload.isFinalized ? 'reported' : 'reviewed');
    return data;
  },

  async updateReport(reportId: string, payload: SaveReportPayload): Promise<MedicalReport> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');

    const updates = {
      bi_rads:              payload.biRads,
      final_recommendation: payload.finalRecommendation,
      findings:             payload.findings    || null,
      impression:           payload.impression  || null,
      recommendation:       payload.recommendation || null,
      breast_density:       payload.breastDensity  || null,
      doctor_notes:         payload.doctorNotes || null,
      is_finalized:         payload.isFinalized,
      finalized_at:         payload.isFinalized ? new Date().toISOString() : null,
    };

    const { data, error } = await getScopedQuery('reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw new Error(error.message || 'Failed to update report.');

    await logAudit(session.user.id, 'REPORT_UPDATED', 'reports', reportId, updates);
    await caseService.bumpStatusForward(payload.caseId, payload.isFinalized ? 'reported' : 'reviewed');
    return data;
  },
};
