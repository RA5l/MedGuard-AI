/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import api from '../lib/api';

export interface Scan {
  id:                string;
  case_id:           string;
  original_scan_url: string;
  scan_view_type:    string;
  laterality:        string | null;
  file_size_bytes:   number | null;
  created_at:        string;
}

export function useScans(caseId: string) {
  const [scans, setScans]       = useState<Scan[]>([]);
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .schema('dev')
        .from('scans')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setScans(data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const uploadScan = async (
    file:         File,
    scanViewType: string
  ) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('case_id',        caseId);
      formData.append('scan_view_type', scanViewType);
      formData.append('file',           file);

      await api.post('/api/scans', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchScans();
    } catch (err: any) {
      setError(err.response?.data?.detail ?? err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { scans, loading, uploading, error, uploadScan, refetch: fetchScans };
}