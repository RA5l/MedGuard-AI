import { getScopedQuery, supabase } from '../../../lib/supabaseClient';
import { logAudit } from '../../../lib/auditLog';

export type AssignmentStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'more_info_requested'
  | 'completed';

export interface CaseAssignment {
  id: string;
  case_id: string;
  assigned_by: string;
  assigned_to: string;
  assigned_to_role: string;
  status: AssignmentStatus;
  decision_reason?: string;
  doctor_reply?: string;       // doctor's reply to more_info_requested
  assigned_at: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
  assigned_by_name?: string;
  assigned_to_name?: string;
  assigned_to_specialty?: string;
}

export interface Radiologist {
  id: string;
  full_name: string;
  email: string;
  specialty?: string;
  is_active: boolean;
}

const RADIOLOGIST_ROLE_ID = '190dddf5-3ba4-437c-a5ec-8767c879c0a1';

export const assignmentService = {

  async getRadiologists(): Promise<Radiologist[]> {
    const { data, error } = await getScopedQuery('users')
      .select('id, full_name, email, specialty, is_active')
      .eq('role_id', RADIOLOGIST_ROLE_ID)
      .order('full_name');
    if (error) throw new Error(error.message || 'Failed to load radiologists.');
    return data || [];
  },

  async getAssignmentByCaseId(caseId: string): Promise<CaseAssignment | null> {
    const { data, error } = await getScopedQuery('case_assignments')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message || 'Failed to load assignment.');
    return data;
  },

  async getMyWorklist(): Promise<CaseAssignment[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');
    const { data, error } = await getScopedQuery('case_assignments')
      .select('*')
      .eq('assigned_to', session.user.id)
      .in('status', ['pending', 'accepted', 'more_info_requested'])
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message || 'Failed to load worklist.');
    return data || [];
  },

  /** Fetch recent assignment activity for the doctor's notification feed */
  async getMyRecentActivity(): Promise<CaseAssignment[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');
    const { data, error } = await getScopedQuery('case_assignments')
      .select('*')
      .eq('assigned_by', session.user.id)
      .in('status', ['accepted', 'rejected', 'more_info_requested', 'completed'])
      .order('updated_at', { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message || 'Failed to load activity.');
    return data || [];
  },

  async assignCase(caseId: string, radiologistId: string): Promise<CaseAssignment> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');
    const { data, error } = await getScopedQuery('case_assignments')
      .insert({
        case_id:          caseId,
        assigned_by:      session.user.id,
        assigned_to:      radiologistId,
        assigned_to_role: 'radiologist',
        status:           'pending',
        assigned_at:      new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message || 'Failed to create assignment.');
    await getScopedQuery('cases').update({ status: 'assigned' }).eq('id', caseId);
    await logAudit(session.user.id, 'CASE_ASSIGNED', 'case_assignments', data.id, {
      case_id: caseId, assigned_to: radiologistId,
    });
    return data;
  },

  async respond(
    assignmentId: string,
    status: 'accepted' | 'rejected' | 'more_info_requested',
    reason?: string,
  ): Promise<CaseAssignment> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');
    const { data, error } = await getScopedQuery('case_assignments')
      .update({
        status,
        decision_reason: reason || null,
        responded_at:    new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .eq('assigned_to', session.user.id)
      .select()
      .single();
    if (error) throw new Error(error.message || 'Failed to update assignment.');
    const caseStatus =
      status === 'accepted'            ? 'in_review' :
      status === 'rejected'            ? 'rejected'  :
      status === 'more_info_requested' ? 'assigned'  : undefined;
    if (caseStatus) {
      await getScopedQuery('cases').update({ status: caseStatus }).eq('id', data.case_id);
    }
    const auditAction =
      status === 'accepted'            ? 'ASSIGNMENT_ACCEPTED'            :
      status === 'rejected'            ? 'ASSIGNMENT_REJECTED'            :
                                         'ASSIGNMENT_MORE_INFO_REQUESTED';
    await logAudit(session.user.id, auditAction, 'case_assignments', assignmentId, {
      case_id: data.case_id, reason,
    });
    return data;
  },

  /** Issue C: Doctor sends reply to radiologist's info request — resets to pending */
  async doctorReply(assignmentId: string, reply: string): Promise<CaseAssignment> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');
    const { data, error } = await getScopedQuery('case_assignments')
      .update({
        status:       'pending',
        doctor_reply: reply,
        responded_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .eq('assigned_by', session.user.id) // only the assigning doctor
      .select()
      .single();
    if (error) throw new Error(error.message || 'Failed to send reply.');
    await getScopedQuery('cases').update({ status: 'assigned' }).eq('id', data.case_id);
    await logAudit(session.user.id, 'DOCTOR_REPLIED_TO_INFO_REQUEST', 'case_assignments', assignmentId, {
      case_id: data.case_id, reply,
    });
    return data;
  },

  async complete(assignmentId: string, caseId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');
    await getScopedQuery('case_assignments')
      .update({ status: 'completed', responded_at: new Date().toISOString() })
      .eq('id', assignmentId)
      .eq('assigned_to', session.user.id);
    await getScopedQuery('cases').update({ status: 'reported' }).eq('id', caseId);
    await logAudit(session.user.id, 'ASSIGNMENT_COMPLETED', 'case_assignments', assignmentId, {
      case_id: caseId,
    });
  },
};