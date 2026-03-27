import { NextResponse } from 'next/server';
import { createUser, listUsers, ALL_PERMISSIONS } from '@/lib/admin-auth';
import { requirePermission } from '@/lib/permissions';
import type { Permission, UserRole } from '@/lib/admin-auth';

// GET /api/admin/users
export async function GET(request: Request) {
    try {
        await requirePermission(request, 'users:manage');
    } catch (response) {
        return response as Response;
    }

    try {
        const users = await listUsers();
        return NextResponse.json({ users });
    } catch (err) {
        console.error('[GET /api/admin/users]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}

// POST /api/admin/users
export async function POST(request: Request) {
    let caller: Awaited<ReturnType<typeof requirePermission>>;

    try {
        caller = await requirePermission(request, 'users:manage');
    } catch (response) {
        return response as Response;
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    const username = body.username as string;
    const password = body.password as string;

    if (!username || username.length < 3) {
        return NextResponse.json({ error: 'Nom d\'utilisateur: 3 caractères minimum' }, { status: 400 });
    }
    if (!password || password.length < 6) {
        return NextResponse.json({ error: 'Mot de passe: 6 caractères minimum' }, { status: 400 });
    }

    const role = (body.role as UserRole) || 'agent';
    if (role === 'admin' && caller.role !== 'admin') {
        return NextResponse.json({ error: 'Seul un admin peut créer un autre admin' }, { status: 403 });
    }

    try {
        const user = await createUser({
            username,
            password,
            displayName: (body.displayName as string) || username,
            role,
            permissions: (body.permissions as Permission[]) || [],
            createdBy: caller.userId,
        });

        if (!user) {
            return NextResponse.json({ error: 'Nom d\'utilisateur déjà utilisé' }, { status: 409 });
        }

        return NextResponse.json({ user }, { status: 201 });
    } catch (err) {
        console.error('[POST /api/admin/users]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
