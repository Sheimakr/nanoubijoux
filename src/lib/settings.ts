/**
 * Server-side settings loader.
 *
 * Reads the single settings row from Supabase. Results are cached with the
 * 'settings' revalidation tag so that `revalidateTag('settings')` — called
 * from the admin PUT handler — will bust the cache and make changes visible
 * on the next page render without a manual refresh.
 *
 * Client components should NOT import this — use the /api/settings route
 * (or pass settings down from a server component) instead.
 */

import { adminSupabase } from '@/lib/admin-supabase';

export interface SiteSettings {
  store_name: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  primary_color: string;
  hero_images: string[];
  ecotrack_token: string;
  ecotrack_enabled: boolean;
  ecotrack_api_url: string;
}

const DEFAULTS: SiteSettings = {
  store_name: 'Nano Bijoux',
  phone: '',
  email: '',
  facebook: '',
  instagram: '',
  primary_color: '#B8860B',
  hero_images: [],
  ecotrack_token: '',
  ecotrack_enabled: false,
  ecotrack_api_url: '',
};

/**
 * Fetch site settings from the DB, merging with safe defaults for any
 * missing or null fields.
 *
 * Ordered by `id` ascending so the result is stable even if multiple
 * rows exist (which shouldn't happen, but historically did — see the
 * deduplication migration).
 */
export async function getSettings(): Promise<SiteSettings> {
  // Order by created_at (not id) because `id` is UUID — UUID sort is
  // lexicographic, not chronological. created_at gives us the real oldest row.
  const { data, error } = await adminSupabase
    .from('settings')
    .select('*')
    .order('created_at', { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('[getSettings]', error.message);
    return DEFAULTS;
  }

  // Merge with defaults — coerce nulls to defaults, preserve typed fields.
  const merged: SiteSettings = { ...DEFAULTS };
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (!(key in DEFAULTS) || val === null || val === undefined) continue;
    const defaultVal = (DEFAULTS as unknown as Record<string, unknown>)[key];
    if (typeof defaultVal === 'boolean') {
      (merged as unknown as Record<string, unknown>)[key] = Boolean(val);
    } else if (typeof defaultVal === 'string') {
      (merged as unknown as Record<string, unknown>)[key] = String(val);
    } else {
      (merged as unknown as Record<string, unknown>)[key] = val;
    }
  }
  return merged;
}
