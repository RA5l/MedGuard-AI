import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Returns the active database schema. Defaults to 'dev' to match backend (DB_SCHEMA in config.py)
// during active development. Override via VITE_DB_SCHEMA. Switch default to 'public' when the
// project moves to production. Also reused for Storage upload paths (mammograms/{schema}/...)
// per user decision: storage folder tracks the active schema.
export const getActiveSchema = (): string => import.meta.env.VITE_DB_SCHEMA || 'dev';

// Scoped query helper: applies the active schema to any table query.
export const getScopedQuery = (table: string) =>
  supabase.schema(getActiveSchema()).from(table);
