import { getScopedQuery } from '../../../lib/supabaseClient';

// Columns confirmed only from backend INSERT payloads (auth.py, cases.py, scans.py):
// user_id, action, entity_type, entity_id, metadata.
// `id` and `created_at` are assumed (standard convention seen on every other
// table in this project) but NOT directly confirmed by any SELECT evidence —
// kept optional so the UI degrades gracefully if either is actually absent.
export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at?: string;
}

export const auditService = {
  async getRecentLogs(limit = 5): Promise<AuditLogEntry[]> {
    const { data, error } = await getScopedQuery('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message || 'Failed to load audit trail.');
    }
    return data || [];
  },
};
