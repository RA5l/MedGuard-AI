import { useState, useEffect, useCallback } from 'react';
import type { Case, CreateCasePayload } from '../types/index';
import { caseService } from '../services/caseService';

export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await caseService.getAllCases();
      setCases(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load cases.');
    } finally {
      setLoading(false);
    }
  }, []);

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
