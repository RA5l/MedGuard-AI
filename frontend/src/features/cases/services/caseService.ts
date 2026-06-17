import { getScopedQuery, supabase } from '../../../lib/supabaseClient';
import type { Case, CreateCasePayload } from '../types/index';

export const caseService = {
  async getAllCases(): Promise<Case[]> {
    const { data, error } = await getScopedQuery('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCaseById(id: string): Promise<Case | null> {
    const { data, error } = await getScopedQuery('cases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createCase(payload: CreateCasePayload): Promise<Case> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');

    const { data, error } = await getScopedQuery('cases')
      .insert({
        ...payload,
        created_by:         session.user.id,
        assigned_doctor_id: session.user.id,
        status:             'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
