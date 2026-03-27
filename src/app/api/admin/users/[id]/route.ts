import { NextResponse } from 'next/server';
import { updateUser, deleteUser, getUserById } from '@/lib/admin-auth';
import { requirePermission } from '@/lib/permissions';
import type { Permission } from '@/lib/admin-auth';

// GET /api/admin/users/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requirePermission(request, 'users:manage');
    } catch (response) {
        return response as Response;
    }

    const { id } = await params;
    const user = await getUserById(id);
    if (!user) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }
    return NextResponse.json({ user });
}

// PATCH /api/admin/users/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    let caller: Awaited<ReturnType<typeof requirePermission>>;
    try {
        caller = await requirePermission(request, 'users:manage');
    } catch (response) {
        return response as Response;
    }

    const { id } = await params;
    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    if (body.role === 'admin' && caller.role !== 'admin') {
        return NextResponse.json({ error: 'Seul un admin peut assigner le rôle admin' }, { status: 403 });
    }

    if (body.active === false && id === caller.userId) {
        return NextResponse.json({ error: 'Vous ne pouvez pas désactiver votre propre compte' }, { status: 400 });
    }

    try {
        const user = await updateUser(id, {
            displayName: body.displayName as string | undefined,
            role: body.role as 'admin' | 'agent' | 'custom' | undefined,
            permissions: body.permissions as Permission[] | undefined,
            active: body.active as boolean | undefined,
            password: body.password as string | undefined,
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (err) {
        console.error('[PATCH /api/admin/users/[id]]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}

// DELETE /api/admin/users/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    let caller: Awaited<ReturnType<typeof requirePermission>>;
    try {
        caller = await requirePermission(request, 'users:manage');
    } catch (response) {
        return response as Response;
    }

    const { id } = await params;

    if (id === caller.userId) {
        return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    const target = await getUserById(id);
    if (!target) {
        return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    if (target.role === 'admin' && caller.role !== 'admin') {
        return NextResponse.json({ error: 'Seul un admin peut supprimer un autre admin' }, { status: 403 });
    }

    const ok = await deleteUser(id);
    return NextResponse.json({ ok });
}
