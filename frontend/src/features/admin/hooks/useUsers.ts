import { useState, useEffect, useCallback } from 'react';
import { getScopedQuery } from '../../../lib/supabaseClient';
import api from '../../../lib/api';

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  is_active: boolean;
  role: 'admin' | 'doctor' | 'radiologist';
  created_at: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  full_name: string;
  role: string;
  specialty: string;
}

export function useUsers() {
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users joined with their role name from the roles table.
      const { data: usersData, error: usersError } = await getScopedQuery('users')
        .select('id, full_name, email, specialty, is_active, created_at, role_id')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const { data: rolesData } = await getScopedQuery('roles').select('id, role_name');
      const roleMap = Object.fromEntries((rolesData ?? []).map(r => [r.id, r.role_name]));

      const resolved: AdminUser[] = (usersData ?? []).map(u => ({
        id:         u.id,
        full_name:  u.full_name,
        email:      u.email,
        specialty:  u.specialty ?? null,
        is_active:  u.is_active,
        created_at: u.created_at,
        role:       (roleMap[u.role_id] ?? 'doctor') as AdminUser['role'],
      }));

      setUsers(resolved);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  // User creation goes through the backend API because Supabase admin operations
  // (creating auth users) require the service key, which must never be in the client.
  const createUser = async (payload: CreateUserPayload): Promise<void> => {
    await api.post('/api/auth/create-user', payload);
    await fetchUsers();
  };

  // Deactivating a user only updates the is_active flag in our users table —
  // no Supabase auth operation required, so this can run client-side.
  const deactivateUser = async (userId: string): Promise<void> => {
    const { error } = await getScopedQuery('users')
      .update({ is_active: false })
      .eq('id', userId);

    if (error) throw error;
    await fetchUsers();
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers, createUser, deactivateUser };
}
