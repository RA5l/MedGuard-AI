import { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '../services/assignmentService';
import type { CaseAssignment, Radiologist } from '../services/assignmentService';

export function useAssignment(caseId?: string) {
  const [assignment, setAssignment]   = useState<CaseAssignment | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const reload = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError('');
    try {
      const data = await assignmentService.getAssignmentByCaseId(caseId);
      setAssignment(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignment.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { reload(); }, [reload]);

  return { assignment, loading, error, reload };
}

export function useRadiologists() {
  const [radiologists, setRadiologists] = useState<Radiologist[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    assignmentService.getRadiologists()
      .then(setRadiologists)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load radiologists.'))
      .finally(() => setLoading(false));
  }, []);

  return { radiologists, loading, error };
}

export function useWorklist() {
  const [worklist, setWorklist] = useState<CaseAssignment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await assignmentService.getMyWorklist();
      setWorklist(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load worklist.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { worklist, loading, error, reload };
}
