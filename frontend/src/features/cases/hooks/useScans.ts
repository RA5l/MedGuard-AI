import { useState, useEffect, useCallback } from 'react';
import { getScopedQuery } from '../../../lib/supabaseClient';

export interface ScanRecord {
  id: string;
  case_id: string;
  scan_view_type: string;
  laterality: 'L' | 'R';
  original_scan_url: string;
  created_at: string;
}

export function useScans(caseId: string) {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    if (!caseId) {
      setScans([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error: queryError } = await getScopedQuery('scans')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (queryError) throw queryError;
      setScans(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load scans.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  return { scans, loading, error, refetch: fetchScans };
}
