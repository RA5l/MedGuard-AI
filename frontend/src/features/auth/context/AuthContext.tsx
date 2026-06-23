import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, getScopedQuery } from '../../../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  specialty: string;
  is_active: boolean;
  role: 'admin' | 'doctor' | 'radiologist';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ROLES = ['admin', 'doctor', 'radiologist'] as const;

function normalizeRole(raw: unknown): UserProfile['role'] {
  const normalized = String(raw ?? '').toLowerCase().trim();
  return (VALID_ROLES as readonly string[]).includes(normalized)
    ? (normalized as UserProfile['role'])
    : 'doctor';
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data: userData, error: userError } = await getScopedQuery('users')
      .select('id, full_name, email, specialty, is_active, role_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('[Auth] users query error:', userError.message);
      return null;
    }
    if (!userData) {
      console.warn('[Auth] No user row found for id:', userId);
      return null;
    }

    let resolvedRole: UserProfile['role'] = 'doctor';

    if (userData.role_id) {
      const { data: roleRow, error: roleError } = await getScopedQuery('roles')
        .select('role_name')
        .eq('id', userData.role_id)
        .single();

      if (roleError) {
        console.error('[Auth] roles query error:', roleError.message);
      } else if (roleRow?.role_name) {
        resolvedRole = normalizeRole(roleRow.role_name);
      } else {
        console.warn('[Auth] role_id found but no matching role row. role_id:', userData.role_id);
      }
    } else {
      console.warn('[Auth] No role_id column found. Columns:', Object.keys(userData));
    }

    console.info(`[Auth] Profile loaded — ${userData.full_name} / role: ${resolvedRole}`);

    return {
      id:        userData.id,
      full_name: userData.full_name,
      email:     userData.email,
      specialty: userData.specialty ?? '',
      is_active: userData.is_active ?? true,
      role:      resolvedRole,
    };
  } catch (err) {
    console.error('[Auth] Unexpected fetchProfile error:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setProfile(await fetchProfile(s.user.id));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        setProfile(s?.user ? await fetchProfile(s.user.id) : null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signOut, isAdmin: profile?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider.');
  return ctx;
}