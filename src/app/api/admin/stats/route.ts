import { NextResponse } from 'next/server';
import { adminSupabase as supabase } from '@/lib/admin-supabase';

// GET /api/admin/stats — Dashboard statistics
export async function GET() {
    try {
        const [ordersRes, productsRes, customersRes, categoriesRes] = await Promise.all([
            supabase.from('orders').select('id, status, total, created_at'),
            supabase.from('products').select('id', { count: 'exact', head: true }),
            supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
            supabase.from('categories').select('id', { count: 'exact', head: true }),
        ]);

        const orders = ordersRes.data ?? [];
        const now = new Date();
        const todayStr = now.toDateString();

        const todayOrders = orders.filter(o => {
            const d = new Date(o.created_at);
            return d.toDateString() === todayStr;
        });

        const count = (status: string) => orders.filter(o => o.status === status).length;

        // Recent 8 orders
        const { data: recentOrders } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(8);

        return NextResponse.json({
            totalOrders: orders.length,
            todayOrders: todayOrders.length,
            totalProducts: productsRes.count ?? 0,
            totalCustomers: customersRes.count ?? 0,
            totalCategories: categoriesRes.count ?? 0,
            pending: count('pending'),
            confirmed: count('confirmed'),
            shipped: count('shipped'),
            delivered: count('delivered'),
            cancelled: count('cancelled'),
            revenue: orders
                .filter(o => o.status === 'delivered')
                .reduce((s, o) => s + (Number(o.total) || 0), 0),
            recentOrders: recentOrders ?? [],
        });
    } catch (err) {
        console.error('[GET /api/admin/stats]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
