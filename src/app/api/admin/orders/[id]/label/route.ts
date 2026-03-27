import { NextResponse } from 'next/server';
import { adminSupabase as supabase } from '@/lib/admin-supabase';
import { EcotrackService } from '@/lib/ecotrack';

// GET /api/admin/orders/[id]/label — Download EcoTrack PDF shipping label
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const { data: order } = await supabase
            .from('orders')
            .select('ecotrack_tracking')
            .eq('id', id)
            .single();

        if (!order?.ecotrack_tracking) {
            return NextResponse.json({ error: 'Pas de numéro de suivi EcoTrack' }, { status: 400 });
        }

        const { data: settings } = await supabase
            .from('settings')
            .select('ecotrack_token, ecotrack_api_url')
            .limit(1)
            .single();

        if (!settings?.ecotrack_token) {
            return NextResponse.json({ error: 'EcoTrack non configuré' }, { status: 400 });
        }

        const ecotrack = new EcotrackService(settings.ecotrack_token, settings.ecotrack_api_url);
        const pdfBuffer = await ecotrack.getLabel(order.ecotrack_tracking);

        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="label-${order.ecotrack_tracking}.pdf"`,
            },
        });
    } catch (err) {
        console.error('[GET /api/admin/orders/[id]/label]', err);
        return NextResponse.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 });
    }
}
