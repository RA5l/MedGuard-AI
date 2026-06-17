import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Returns the active database schema. Defaults to 'public'; override via VITE_DB_SCHEMA.
const getActiveSchema = (): string => import.meta.env.VITE_DB_SCHEMA || 'public';

// Scoped query helper: applies the active schema to any table query.
export const getScopedQuery = (table: string) =>
  supabase.schema(getActiveSchema()).from(table);
