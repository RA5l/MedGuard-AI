import { getScopedQuery, supabase } from '../../../lib/supabaseClient';
import { logAudit } from '../../../lib/auditLog';
import type { Case, CreateCasePayload, UpdateCasePayload } from '../types/index';

// Reads use v_case_dashboard (same view the backend API uses) so that
// ai_prediction, ai_confidence, total_scans, and assigned_doctor_name are
// populated. NOTE: this assumes the anon key has SELECT grant/RLS access on
// this view — unverified, no DB connection available to confirm. If this
// query errors with a permission/relation error, the view needs a GRANT
// SELECT / RLS policy for the anon/authenticated role.
//
// select('*') is used instead of an aliased column list (e.g. 'id:case_id, ...')
// because supabase-js v2's TS select-string parser falls back to a
// GenericStringError return type on multi-column alias strings when the
// client has no generated Database<> type — that broke `tsc -b` (see build
// log). The view's PK column "case_id" is remapped to "id" in JS afterward
// to match the Case type.
//
// CONFIRMED via the real v_case_dashboard column list (Supabase API docs):
// the view does NOT expose notes, assigned_doctor_id, or created_by (raw
// UUIDs) — only assigned_doctor_name/created_by_name/assigned_doctor_email/
// assigned_doctor_specialty (display strings). Both getAllCases and
// getCaseById below merge those three fields in from the raw cases table,
// since useCases' role-based visibility filter needs the real
// assigned_doctor_id/created_by UUIDs (matching by name/email would be
// fragile), and CaseDetailsPage's edit form needs the real notes text.
function mapViewRowToCase(row: Record<string, unknown>): Case {
  return { ...row, id: row.case_id } as unknown as Case;
}

const RAW_CASE_MERGE_COLUMNS = 'id, notes, assigned_doctor_id, created_by, deleted_at';

function mergeRawFields(viewRow: Case, rawRow: Record<string, unknown> | undefined): Case {
  if (!rawRow) return viewRow;
  return {
    ...viewRow,
    notes: (rawRow.notes as string) ?? '',
    assigned_doctor_id: rawRow.assigned_doctor_id as string | undefined,
    created_by: rawRow.created_by as string | undefined,
    deleted_at: rawRow.deleted_at as string | null,
  };
}

// STOPGAP, NOT A FIX: v_case_dashboard returns one row PER joined
// scan/ai_result for a case (confirmed: a case with 3 scans + multiple AI
// analyses produces duplicate case_id rows — caused a real React "duplicate
// key" warning and crashes in getCaseById's .single() call). This keeps
// only the first row per case_id, but that row's total_scans/ai_prediction
// may not be the correct aggregate (e.g. total_scans could read as 1
// instead of 3, or show a stale prediction). The real fix is server-side:
// the view needs proper aggregation (COUNT for total_scans, a
// DISTINCT ON / window function ordered by created_at for the latest
// ai_result) instead of a plain JOIN. Flagging this rather than silently
// trusting the displayed numbers.
function dedupeByCaseId(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  return rows.filter(row => {
    const id = row.case_id as string;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// case_status pipeline order, used by bumpStatusForward below. 'archived' is
// intentionally excluded - it's only ever set manually (e.g. via
// StatusQuickEdit), never auto-advanced into or out of by a workflow action.
const STATUS_RANK: Record<string, number> = {
  pending: 0, processing: 1, ai_complete: 2, reviewed: 3, reported: 4,
};

export const caseService = {
  async getAllCases(): Promise<Case[]> {
    const { data, error } = await getScopedQuery('v_case_dashboard')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const cases = dedupeByCaseId(data || []).map(mapViewRowToCase);
    if (cases.length === 0) return [];

    const { data: rawRows, error: rawError } = await getScopedQuery('cases')
      .select(RAW_CASE_MERGE_COLUMNS)
      .in('id', cases.map(c => c.id));
    if (rawError) throw rawError;

    const rawById = new Map((rawRows || []).map((r: Record<string, unknown>) => [r.id as string, r]));
    return cases
      .map(c => mergeRawFields(c, rawById.get(c.id)))
      .filter(c => !c.deleted_at);
  },

  async getCaseById(id: string): Promise<Case | null> {
    const { data, error } = await getScopedQuery('v_case_dashboard')
      .select('*')
      .eq('case_id', id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return null;

    const caseRow = mapViewRowToCase(data[0]);
    const { data: rawRow, error: rawError } = await getScopedQuery('cases')
      .select(RAW_CASE_MERGE_COLUMNS)
      .eq('id', id)
      .single();
    if (rawError) throw rawError;

    return mergeRawFields(caseRow, rawRow);
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

    await logAudit(session.user.id, 'CASE_CREATED', 'cases', data.id, { case_code: payload.case_code });
    return data;
  },

  async updateCase(id: string, payload: UpdateCasePayload): Promise<Case> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');

    const { data, error } = await getScopedQuery('cases')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(session.user.id, 'CASE_UPDATED', 'cases', id, payload as Record<string, unknown>);
    return data;
  },

  // Auto-advances a case's status as a side effect of a workflow action
  // (scan uploaded -> processing, AI analysis done -> ai_complete, report
  // drafted -> reviewed, report finalized -> reported). Never regresses
  // status (e.g. won't move a 'reported' case back to 'processing' just
  // because a new scan was added), and never touches 'archived' (manual
  // only). Silently no-ops on failure - this is a side effect of another
  // action's success and shouldn't block or surface errors for it.
  async bumpStatusForward(caseId: string, candidateStatus: keyof typeof STATUS_RANK): Promise<void> {
    try {
      const { data: current, error: fetchErr } = await getScopedQuery('cases')
        .select('status').eq('id', caseId).single();
      if (fetchErr || !current) return;

      const currentRank = STATUS_RANK[current.status as string];
      const candidateRank = STATUS_RANK[candidateStatus];
      if (currentRank === undefined || candidateRank === undefined || candidateRank <= currentRank) return;

      await getScopedQuery('cases').update({ status: candidateStatus }).eq('id', caseId);
    } catch {
      // Best-effort only - never block the primary action on this.
    }
  },

  // Soft delete only, per policy: no real DELETE is ever issued. Requires
  // deleted_at/deleted_by/delete_reason columns on the `cases` table (see
  // SQL provided separately) and the view/list queries to exclude rows
  // where deleted_at IS NOT NULL. UI-gated to admin only; real enforcement
  // should also exist as an RLS policy or a DB trigger blocking UPDATE of
  // status alone from un-deleting without authorization, but a full
  // undelete workflow is out of scope here.
  async softDeleteCase(caseId: string, reason: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');

    const { error } = await getScopedQuery('cases').update({
      deleted_at: new Date().toISOString(),
      deleted_by: session.user.id,
      delete_reason: reason,
    }).eq('id', caseId);

    if (error) {
      throw new Error(error.message || 'Failed to delete case.');
    }

    await logAudit(session.user.id, 'CASE_DELETED', 'cases', caseId, { delete_reason: reason });
  },
};
