import { NextResponse } from 'next/server';
import { adminSupabase as supabase } from '@/lib/admin-supabase';

// GET /api/admin/settings
export async function GET() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('[GET /api/admin/settings]', error);
        return NextResponse.json({}, { status: 200 });
    }

    return NextResponse.json(data);
}

// PUT /api/admin/settings
export async function PUT(req: Request) {
    const body = await req.json();

    // Get existing settings row ID
    const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .single();

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

    return NextResponse.json({ ok: true });
}
