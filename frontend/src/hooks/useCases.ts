
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Case {
  case_id:              string;
  case_code:            string;
  patient_alias:        string | null;
  status:               string;
  priority:             number;
  notes:                string | null;
  created_at:           string;
  updated_at:           string;
  created_by_name:      string | null;
  assigned_doctor_name: string | null;
  total_scans:          number;
  ai_prediction:        string | null;
  ai_confidence:        number | null;
  report_finalized:     boolean;
}

export function useCases() {
  const [cases, setCases]     = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .schema('dev')
        .from('v_case_dashboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCases(); }, [fetchCases]);

  const createCase = async (payload: {
    case_code:     string;
    patient_alias: string;
    priority:      number;
    notes:         string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase
      .schema('dev')
      .from('cases')
      .insert({
        ...payload,
        created_by:         session?.user.id,
        assigned_doctor_id: session?.user.id,
        status:             'pending',
      })
      .select()
      .single();

    if (error) throw error;
    await fetchCases();
    return data;
  };

  return { cases, loading, error, refetch: fetchCases, createCase };
}