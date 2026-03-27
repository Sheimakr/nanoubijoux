import { NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword, hashPassword } from '@/lib/admin-auth';
import { getUserFromRequest } from '@/lib/permissions';
import { adminSupabase as supabase } from '@/lib/admin-supabase';

// PATCH /api/admin/auth/password — Change own password
export async function PATCH(req: Request) {
    const user = await getUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    let currentPassword: string;
    let newPassword: string;

    try {
        const body = await req.json();
        currentPassword = body.currentPassword;
        newPassword = body.newPassword;
    } catch {
        return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Mot de passe actuel et nouveau requis' }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
    }

    try {
        const dbUser = await getUserByUsername(user.username);
        if (!dbUser) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
        }

        const valid = await verifyPassword(currentPassword, dbUser.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 });
        }

        const newHash = await hashPassword(newPassword);
        const { error } = await supabase
            .from('admin_users')
            .update({ password_hash: newHash })
            .eq('id', dbUser.id);

        if (error) {
            return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[PATCH /api/admin/auth/password]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
