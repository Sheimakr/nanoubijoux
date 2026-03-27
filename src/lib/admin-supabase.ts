/**
 * admin-supabase.ts — Singleton Supabase client for admin operations.
 *
 * Uses @supabase/supabase-js directly (not @supabase/ssr) because admin
 * auth is JWT-based (custom tokens in admin_session cookie), not Supabase Auth.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (!_client) {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars');
        }
        _client = createClient(supabaseUrl, supabaseKey);
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
