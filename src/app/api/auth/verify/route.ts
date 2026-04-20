import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/admin-supabase';

/**
 * GET /api/auth/verify?id=<uuid>
 *
 * Checks whether the given user_id still exists in `auth.users`.
 * Used by the client-side auth store on mount to detect "ghost
 * sessions" — the case where a JWT in localStorage is still valid
 * but the user row was deleted in Supabase. Without this check the
 * app thinks the user is logged in, queries with a stale user.id,
 * and silently returns zero rows for everything.
 *
 * Server-side only — uses the service-role client (bypasses RLS).
 * Returns { exists: boolean } — safe shape for public consumption
 * (doesn't leak any user data beyond existence).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ exists: false, error: 'missing id' }, { status: 400 });
  }

  try {
    // auth.admin.getUserById returns { data: { user }, error }.
    // If the user was deleted, error is truthy with code 'user_not_found'.
    const { data, error } = await adminSupabase.auth.admin.getUserById(id);

    if (error || !data?.user) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true });
  } catch (err) {
    // Network / config failure — treat as "can't verify"; don't force
    // a logout purely on transient errors. Client decides how to react.
    console.error('[GET /api/auth/verify]', err);
    return NextResponse.json(
      { exists: false, error: 'verify_failed' },
      { status: 500 },
    );
  }
}
