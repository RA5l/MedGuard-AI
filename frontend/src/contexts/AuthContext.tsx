import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id:        string;
  full_name: string;
  email:     string;
  role:      'admin' | 'doctor' | 'radiologist';
  specialty: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user:          User | null;
  profile:       UserProfile | null;
  session:       Session | null;
  loading:       boolean;
  signIn:        (email: string, password: string) => Promise<{ error: string | null }>;
  signOut:       () => Promise<void>;
  isAdmin:       boolean;
  isDoctor:      boolean;
  isRadiologist: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: userData, error } = await supabase
        .schema('dev')
        .from('users')
        .select('id, full_name, email, specialty, is_active, role_id')
        .eq('id', userId)
        .single();

      if (error || !userData) return null;

      const { data: rolesData } = await supabase
        .schema('dev')
        .from('roles')
        .select('id, role_name');

      const matched = rolesData?.find(r => r.id === userData.role_id);
      const role    = (matched?.role_name ?? 'doctor') as UserProfile['role'];

      return {
        id:        userData.id,
        full_name: userData.full_name,
        email:     userData.email,
        specialty: userData.specialty,
        is_active: userData.is_active,
        role,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) setProfile(await fetchProfile(session.user.id));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setProfile(await fetchProfile(session.user.id));
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, signIn, signOut,
      isAdmin:       profile?.role === 'admin',
      isDoctor:      profile?.role === 'doctor',
      isRadiologist: profile?.role === 'radiologist',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
