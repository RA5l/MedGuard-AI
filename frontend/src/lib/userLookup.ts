import { getScopedQuery } from './supabaseClient';

/**
 * Batched lookup of full_name for a list of public.users ids.
 * Returns a map of id -> full_name. Missing/unauthorized ids are simply
 * absent from the result (caller should provide a fallback).
 */
export async function getUserNamesByIds(ids: string[]): Promise<Record<string, string>> {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return {};

  const { data, error } = await getScopedQuery('users')
    .select('id, full_name')
    .in('id', uniqueIds);

  if (error) {
    throw new Error(error.message || 'Failed to load user names.');
  }
  return Object.fromEntries((data || []).map((u: { id: string; full_name: string }) => [u.id, u.full_name]));
}
