/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface User {
  id:         string;
  full_name:  string;
  email:      string;
  role:       string;
  specialty:  string | null;
  is_active:  boolean;
  created_at: string | null;
}

export function useUsers() {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/auth/users');
      setUsers(res.data.users ?? []);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const createUser = async (payload: {
    email:     string;
    password:  string;
    full_name: string;
    role:      string;
    specialty: string;
  }) => {
    const res = await api.post('/api/auth/create-user', payload);
    await fetchUsers();
    return res.data;
  };

  const deactivateUser = async (userId: string) => {
    await api.patch(`/api/auth/users/${userId}/deactivate`);
    await fetchUsers();
  };

  return { users, loading, error, createUser, deactivateUser, refetch: fetchUsers };
}