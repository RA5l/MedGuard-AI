import { useState, useEffect, useCallback } from 'react';
import type { Case, CreateCasePayload } from '../types/index';
import { caseService } from '../services/caseService';
import { useAuth } from '../../auth/context/AuthContext';

// Client-side visibility filter matching the requested role permissions:
//   Admin       - sees every case
//   Doctor      - sees only cases assigned to them or created by them
//   Radiologist - sees the shared active-pipeline queue (no per-radiologist
//                 assignment column exists in the schema, so this is a
//                 shared-worklist model, matching the existing Dashboard
//                 "Radiologist Worklist" definition - pending/processing/
//                 ai_complete/reviewed, i.e. anything not yet reported or
//                 archived)
//
// IMPORTANT: this is UX-layer only, not real security. A user could still
// read other rows via direct Supabase calls if Row Level Security isn't
// also enforced on the cases table / v_case_dashboard view in Postgres.
// RLS policies for this same logic should be applied on the DB side.
function filterCasesForRole(cases: Case[], profile: { id: string; role: string } | null): Case[] {
  if (!profile) return [];
  if (profile.role === 'admin') return cases;
  if (profile.role === 'doctor') {
    return cases.filter(c => c.assigned_doctor_id === profile.id || c.created_by === profile.id);
  }
  if (profile.role === 'radiologist') {
    return cases.filter(c => ['pending', 'processing', 'ai_complete', 'reviewed'].includes(c.status));
  }
  return [];
}

export function useCases() {
  const { profile } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await caseService.getAllCases();
      setCases(filterCasesForRole(data, profile));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load cases.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const createCase = async (payload: CreateCasePayload): Promise<Case> => {
    const newCase = await caseService.createCase(payload);
    // Refresh the list after creation so the new case appears immediately.
    await fetchCases();
    return newCase;
  };

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return { cases, loading, error, refetch: fetchCases, createCase };
}
