import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { adminSupabase as supabase } from '@/lib/admin-supabase';

/**
 * Settings API.
 *
 * Historically the `settings` table was selected via `.single()`, which
 * errors silently if more than one row exists (an anomaly we've observed).
 * Now we always ORDER BY id ASC + LIMIT 1 + maybeSingle() to pick the
 * canonical oldest row deterministically.
 */

// GET /api/admin/settings
export async function GET() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        // Order by created_at because `id` is UUID (lexicographic, not chronological).
        .order('created_at', { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[GET /api/admin/settings]', error);
        return NextResponse.json({}, { status: 200 });
    }

    return NextResponse.json(data ?? {});
}

// PUT /api/admin/settings
export async function PUT(req: Request) {
    const body = await req.json();

    // Resolve the canonical row deterministically (oldest id first).
    const { data: existing } = await supabase
        .from('settings')
        .select('id')
        // Order by created_at because `id` is UUID (lexicographic, not chronological).
        .order('created_at', { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();

    if (existing) {
        const { error } = await supabase
            .from('settings')
            .update({ ...body, updated_at: new Date().toISOString() })
            .eq('id', existing.id);

        if (error) {
            console.error('[PUT /api/admin/settings]', error);
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }
    } else {
        const { error } = await supabase
            .from('settings')
            .insert(body);

        if (error) {
            console.error('[PUT /api/admin/settings] insert', error);
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }
    }

    // Invalidate every server component tagged 'settings' (homepage footer,
    // contact widgets, etc.) so edits are reflected on the next render
    // without a manual refresh or redeploy.
    // Next.js 16 requires the second `profile` arg — 'max' gives
    // stale-while-revalidate semantics (users see stale data for one
    // render while fresh values fetch in the background).
    revalidateTag('settings', 'max');

    return NextResponse.json({ ok: true });
}
