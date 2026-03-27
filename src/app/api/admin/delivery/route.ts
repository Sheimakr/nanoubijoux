import { NextResponse } from 'next/server';
import { adminSupabase as supabase } from '@/lib/admin-supabase';

// GET /api/admin/delivery — Get all wilayas with delivery pricing
export async function GET() {
    const { data, error } = await supabase
        .from('wilayas')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('[GET /api/admin/delivery]', error);
        return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data ?? []);
}

// PUT /api/admin/delivery — Update delivery pricing for wilayas
export async function PUT(req: Request) {
    const body = await req.json();

    if (!Array.isArray(body)) {
        return NextResponse.json({ error: 'Expected array of wilayas' }, { status: 400 });
    }

    const errors: string[] = [];

    for (const wilaya of body) {
        const { error } = await supabase
            .from('wilayas')
            .update({
                shipping_fee: wilaya.shipping_fee ?? wilaya.home_fee,
                home_fee: wilaya.home_fee ?? wilaya.shipping_fee,
                desk_fee: wilaya.desk_fee ?? 0,
                free_from: wilaya.free_from ?? 0,
            })
            .eq('id', wilaya.id);

        if (error) {
            errors.push(`Wilaya ${wilaya.id}: ${error.message}`);
        }
    }

    if (errors.length > 0) {
        return NextResponse.json({ ok: false, errors }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
