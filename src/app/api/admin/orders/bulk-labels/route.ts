import { NextResponse } from 'next/server';
import { adminSupabase as supabase } from '@/lib/admin-supabase';
import { EcotrackService } from '@/lib/ecotrack';

// POST /api/admin/orders/bulk-labels — Download multiple PDF labels
export async function POST(req: Request) {
    try {
        const { orderIds } = await req.json();

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: 'orderIds requis' }, { status: 400 });
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

        // Get tracking numbers for orders
        const { data: orders } = await supabase
            .from('orders')
            .select('id, ecotrack_tracking')
            .in('id', orderIds);

        const trackingNumbers = (orders ?? [])
            .filter(o => o.ecotrack_tracking)
            .map(o => o.ecotrack_tracking as string);

        if (trackingNumbers.length === 0) {
            return NextResponse.json({ error: 'Aucune commande avec numéro de suivi' }, { status: 400 });
        }

        // For single label, return directly
        if (trackingNumbers.length === 1) {
            const pdfBuffer = await ecotrack.getLabel(trackingNumbers[0]);
            return new Response(pdfBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="labels.pdf"`,
                },
            });
        }

        // For multiple, fetch each and return as JSON with base64 PDFs
        const labels: Array<{ tracking: string; pdf: string; error?: string }> = [];

        for (const tracking of trackingNumbers) {
            try {
                const buffer = await ecotrack.getLabel(tracking);
                const base64 = Buffer.from(buffer).toString('base64');
                labels.push({ tracking, pdf: base64 });
            } catch (err) {
                labels.push({ tracking, pdf: '', error: String(err instanceof Error ? err.message : err) });
            }
        }

        return NextResponse.json({ ok: true, labels });
    } catch (err) {
        console.error('[POST /api/admin/orders/bulk-labels]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
