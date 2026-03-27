import { NextResponse } from 'next/server';
import { adminSupabase as supabase } from '@/lib/admin-supabase';
import { EcotrackService } from '@/lib/ecotrack';

// GET /api/admin/ecotrack/communes?wilaya_id=XX
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const wilayaId = searchParams.get('wilaya_id');

    if (!wilayaId) {
        return NextResponse.json({ error: 'wilaya_id requis' }, { status: 400 });
    }

    try {
        // Get EcoTrack settings
        const { data: settings } = await supabase
            .from('settings')
            .select('ecotrack_token, ecotrack_api_url, ecotrack_enabled')
            .limit(1)
            .single();

        if (!settings?.ecotrack_enabled || !settings?.ecotrack_token) {
            return NextResponse.json({ error: 'EcoTrack non configuré' }, { status: 400 });
        }

        const ecotrack = new EcotrackService(settings.ecotrack_token, settings.ecotrack_api_url);
        const communes = await ecotrack.getCommunes(wilayaId);

        return NextResponse.json(communes);
    } catch (err) {
        console.error('[GET /api/admin/ecotrack/communes]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
