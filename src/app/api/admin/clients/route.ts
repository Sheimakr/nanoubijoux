import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';

// GET /api/admin/clients — List all customers (uses service role to bypass RLS)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const limit = Number(searchParams.get('limit') || '20');
  const offset = Number(searchParams.get('offset') || '0');

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/admin/clients]', error.message);
      return NextResponse.json({ customers: [], total: 0, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ customers: data ?? [], total: count ?? 0 });
  } catch (err) {
    console.error('[GET /api/admin/clients]', err);
    return NextResponse.json({ customers: [], total: 0 }, { status: 200 });
  }
}
