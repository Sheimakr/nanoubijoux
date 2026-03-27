import { NextResponse } from 'next/server';
import { adminSupabase as supabase } from '@/lib/admin-supabase';
import { EcotrackService } from '@/lib/ecotrack';
import { matchCommune } from '@/lib/commune-matcher';

// POST /api/admin/orders/[id]/ship — Send single order to EcoTrack
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        // Get order
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (orderErr || !order) {
            return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
        }

        if (order.ecotrack_tracking) {
            return NextResponse.json({ error: 'Commande déjà envoyée à EcoTrack' }, { status: 400 });
        }

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

        // Extract address from shipping_address JSONB
        const addr = order.shipping_address || {};
        const fullName = addr.full_name || order.customer_name || '';
        const phone = (addr.phone || order.customer_phone || '').replace(/\D/g, '').slice(-10);
        const address = addr.address_line || addr.address || '';
        const communeName = addr.commune || order.commune || '';

        // Get wilaya ID from wilayas table
        const wilayaName = addr.wilaya || '';
        let wilayaId = '16'; // Default to Alger
        if (wilayaName) {
            const { data: wilayaRow } = await supabase
                .from('wilayas')
                .select('id')
                .ilike('name', wilayaName)
                .limit(1)
                .single();

            if (wilayaRow) {
                wilayaId = String(wilayaRow.id);
            }
        }

        // Match commune name against EcoTrack's list
        const matchedCommune = await matchCommune(ecotrack, communeName, wilayaId);

        const payload = {
            nom_client: fullName,
            telephone: phone,
            adresse: address,
            commune: matchedCommune,
            code_wilaya: wilayaId,
            montant: Number(order.total) || 0,
            type: 1, // Delivery
            stop_desk: order.delivery_type === 'desk' ? 1 : 0,
            reference: order.id,
        };

        const result = await ecotrack.createOrder(payload);

        // Extract tracking from response
        const tracking = result?.tracking || result?.data?.tracking || result?.order?.tracking || '';
        const ecotrackId = result?.id || result?.data?.id || result?.order?.id || '';

        // Update order with EcoTrack info
        const { error: updateErr } = await supabase
            .from('orders')
            .update({
                ecotrack_tracking: tracking,
                ecotrack_id: String(ecotrackId),
                status: 'shipped',
            })
            .eq('id', id);

        if (updateErr) {
            console.error('[ship] Update order failed:', updateErr);
        }

        return NextResponse.json({
            ok: true,
            tracking,
            ecotrackId: String(ecotrackId),
        });
    } catch (err) {
        console.error('[POST /api/admin/orders/[id]/ship]', err);
        return NextResponse.json({ error: String(err instanceof Error ? err.message : err) }, { status: 500 });
    }
}
