import { NextResponse } from 'next/server';
import { adminSupabase as supabase } from '@/lib/admin-supabase';
import { EcotrackService } from '@/lib/ecotrack';
import { matchCommune } from '@/lib/commune-matcher';

// POST /api/admin/orders/bulk-ship — Bulk send orders to EcoTrack
export async function POST(req: Request) {
    try {
        const { orderIds } = await req.json();

        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: 'orderIds requis (tableau)' }, { status: 400 });
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

        // Get all orders
        const { data: orders, error: ordersErr } = await supabase
            .from('orders')
            .select('*')
            .in('id', orderIds);

        if (ordersErr || !orders) {
            return NextResponse.json({ error: 'Erreur lors de la récupération des commandes' }, { status: 500 });
        }

        // Get all wilayas for name→ID mapping
        const { data: wilayas } = await supabase.from('wilayas').select('id, name');
        const wilayaMap = new Map((wilayas ?? []).map(w => [w.name?.toLowerCase(), String(w.id)]));

        const results: Array<{ orderId: string; ok: boolean; tracking?: string; error?: string }> = [];

        for (const order of orders) {
            if (order.ecotrack_tracking) {
                results.push({ orderId: order.id, ok: false, error: 'Déjà envoyée' });
                continue;
            }

            try {
                const addr = order.shipping_address || {};
                const wilayaName = (addr.wilaya || '').toLowerCase();
                const wilayaId = wilayaMap.get(wilayaName) || '16';
                const communeName = addr.commune || order.commune || '';
                const matchedCommune = await matchCommune(ecotrack, communeName, wilayaId);

                const payload = {
                    nom_client: addr.full_name || order.customer_name || '',
                    telephone: (addr.phone || order.customer_phone || '').replace(/\D/g, '').slice(-10),
                    adresse: addr.address_line || addr.address || '',
                    commune: matchedCommune,
                    code_wilaya: wilayaId,
                    montant: Number(order.total) || 0,
                    type: 1,
                    stop_desk: order.delivery_type === 'desk' ? 1 : 0,
                    reference: order.id,
                };

                const result = await ecotrack.createOrder(payload);
                const tracking = result?.tracking || result?.data?.tracking || result?.order?.tracking || '';
                const ecotrackId = result?.id || result?.data?.id || result?.order?.id || '';

                await supabase
                    .from('orders')
                    .update({
                        ecotrack_tracking: tracking,
                        ecotrack_id: String(ecotrackId),
                        status: 'shipped',
                    })
                    .eq('id', order.id);

                results.push({ orderId: order.id, ok: true, tracking });
            } catch (err) {
                results.push({
                    orderId: order.id,
                    ok: false,
                    error: String(err instanceof Error ? err.message : err),
                });
            }
        }

        const successCount = results.filter(r => r.ok).length;
        return NextResponse.json({ ok: true, total: results.length, success: successCount, results });
    } catch (err) {
        console.error('[POST /api/admin/orders/bulk-ship]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
