import { NextResponse } from 'next/server';
import { fetchAllCommunes } from '@/lib/communes-loader';

// Cache communes in memory (loaded once per server instance)
let communesCache: Record<number, string[]> | null = null;

// GET /api/communes?wilaya_code=16
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const wilayaCode = searchParams.get('wilaya_code');

    if (!communesCache) {
        communesCache = await fetchAllCommunes();
    }

    // Return all communes if no wilaya_code specified
    if (!wilayaCode) {
        return NextResponse.json(communesCache);
    }

    const code = parseInt(wilayaCode, 10);
    if (isNaN(code)) {
        return NextResponse.json({ error: 'wilaya_code invalide' }, { status: 400 });
    }

    const communes = communesCache[code] || [];
    return NextResponse.json(communes);
}
