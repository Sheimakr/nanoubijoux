/**
 * admin-supabase.ts — Singleton Supabase client for admin operations.
 *
 * Uses service_role key to bypass RLS for admin_users table access.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use service role key for admin operations (bypasses RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (!_client) {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
        }
        _client = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }
    return _client;
}

export const adminSupabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getClient() as any)[prop];
    },
});

export function getStorageUrl(bucket: string, filePath: string): string {
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
}
