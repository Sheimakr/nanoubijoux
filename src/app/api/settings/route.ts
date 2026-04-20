import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin-client';

// GET /api/settings — public, read-only store settings
export async function GET() {
  try {
    const supabase = createAdminClient();
    // Order by created_at so we always get the canonical (oldest) row,
    // even if a duplicate ever sneaks back in. `id` is a UUID so sorting
    // on it is lexicographic — not chronological.
    const { data, error } = await supabase
      .from('settings')
      .select('store_name, phone, email, facebook, instagram, primary_color, hero_images')
      .order('created_at', { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({}, { status: 200 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
