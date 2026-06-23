import { supabase, getScopedQuery, getActiveSchema } from '../../../lib/supabaseClient';
import { logAudit } from '../../../lib/auditLog';
import { caseService } from './caseService';
import type { ScanRecord } from '../hooks/useScans';

export type ScanViewType = 'RCC' | 'LCC' | 'RMLO' | 'LMLO';

export interface UploadScanParams {
  caseId: string;
  file: File;
  scanViewType: ScanViewType;
}

// Bucket confirmed via Supabase Storage dashboard screenshot: "mammograms",
// containing folders "dev" and "scans". Per explicit user decision, uploads
// go under {activeSchema}/{case_id}/... so the storage path tracks the same
// dev/public switch as the database schema.
const BUCKET = 'mammograms';

export const scanService = {
  async uploadScan({ caseId, file, scanViewType }: UploadScanParams): Promise<ScanRecord> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated.');

    const schema = getActiveSchema();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${schema}/${caseId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      throw new Error(uploadError.message || 'Failed to upload scan image to storage.');
    }

    // NOTE: assumes the "mammograms" bucket is public (matches existing
    // ScanList.tsx code, which links directly to original_scan_url with no
    // signed-URL logic). Unverified — if the bucket is private, this URL
    // will not resolve and signed URLs would be needed instead.
    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // laterality is NOT sent — confirmed by user inspection of the live
    // schema to be a generated/computed column (derived from scan_view_type
    // via a CASE expression). Passing any value for it raises a Postgres
    // error ("cannot insert a non-DEFAULT value into column \"laterality\"").
    const { data, error } = await getScopedQuery('scans')
      .insert({
        case_id: caseId,
        original_scan_url: publicUrlData.publicUrl,
        scan_view_type: scanViewType,
        uploaded_by: session.user.id,
        file_size_bytes: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to save scan record.');
    }

    await logAudit(session.user.id, 'SCAN_UPLOADED', 'scans', data.id, {
      case_id: caseId,
      scan_view_type: scanViewType,
      file_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
    });
    await caseService.bumpStatusForward(caseId, 'processing');
    return data;
  },
};
