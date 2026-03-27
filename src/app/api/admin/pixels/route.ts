import { NextResponse } from 'next/server';
import { adminSupabase as supabase } from '@/lib/admin-supabase';

// GET /api/admin/pixels
export async function GET() {
    const { data, error } = await supabase
        .from('pixels')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[GET /api/admin/pixels]', error);
        return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data ?? []);
}

// POST /api/admin/pixels
export async function POST(req: Request) {
    const body = await req.json();

    const { data, error } = await supabase
        .from('pixels')
        .insert({
            name: body.name,
            type: body.type || 'other',
            mode: body.mode || 'snippet',
            pixel_id: body.pixel_id || null,
            code: body.code || null,
            active: body.active ?? true,
        })
        .select()
        .single();

    if (error) {
        console.error('[POST /api/admin/pixels]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
