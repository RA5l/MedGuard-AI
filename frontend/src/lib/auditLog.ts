import { getScopedQuery } from './supabaseClient';

/**
 * Records an audit_logs row for a frontend-initiated write. Mirrors the
 * exact action/entity_type naming convention used by the backend (e.g.
 * CASE_CREATED/cases, CASE_UPDATED/cases, SCAN_UPLOADED/scans) so entries
 * from both write paths look identical in the Audit Trail.
 *
 * Failures here are logged to console but NOT thrown — a failed audit
 * insert (e.g. due to an RLS gap) should not block the primary action
 * (case create/update, scan upload) from succeeding for the user.
 */
export async function logAudit(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const { error } = await getScopedQuery('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
  if (error) {
    console.error('[Audit] Failed to record audit log:', error.message);
  }
}
