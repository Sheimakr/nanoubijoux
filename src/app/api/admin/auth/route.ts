import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
    bootstrapAdminIfNeeded,
    createSession,
    getUserByUsername,
    validateSession,
    verifyPassword,
    createJWT,
    ALL_PERMISSIONS,
} from '@/lib/admin-auth';

// POST /api/admin/auth — Login
export async function POST(req: Request) {
    let username: string;
    let password: string;

    try {
        const body = await req.json();
        username = body.username;
        password = body.password;
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!username || !password) {
        return NextResponse.json({ error: 'Nom d\'utilisateur et mot de passe requis' }, { status: 400 });
    }

    try {
        let token: string;
        let userInfo: { id: string; username: string; displayName: string; role: string; permissions: string[] };

        let dbAvailable = true;
        try {
            await bootstrapAdminIfNeeded();
        } catch {
            dbAvailable = false;
        }

        if (dbAvailable) {
            const user = await getUserByUsername(username);
            if (user) {
                const passwordValid = await verifyPassword(password, user.passwordHash);
                if (!passwordValid) {
                    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
                }
                token = await createSession(user);
                userInfo = {
                    id: user.id,
                    username: user.username,
                    displayName: user.displayName,
                    role: user.role,
                    permissions: user.permissions,
                };
            } else {
                dbAvailable = false;
            }
        }

        if (!dbAvailable) {
            // Fallback bootstrap login when the admin_users table is unreachable.
            // REQUIRES env vars — no hardcoded defaults. If ADMIN_USER / ADMIN_PASS
            // / ADMIN_SECRET are missing, fail loudly so admins notice in dev and
            // deployments don't silently launch with "admin/admin123".
            const envUser   = process.env.ADMIN_USER;
            const envPass   = process.env.ADMIN_PASS;
            const envSecret = process.env.ADMIN_SECRET;

            if (!envUser || !envPass || !envSecret) {
                console.error(
                    '[admin/auth] Missing required env vars: ADMIN_USER / ADMIN_PASS / ADMIN_SECRET',
                );
                return NextResponse.json(
                    { error: 'Server misconfigured — admin credentials env vars not set' },
                    { status: 500 },
                );
            }

            if (username !== envUser || password !== envPass) {
                return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
            }

            const secret = envSecret;
            token = await createJWT(
                {
                    userId: 'env-admin',
                    username: envUser,
                    displayName: 'Administrateur',
                    role: 'admin',
                    permissions: ALL_PERMISSIONS,
                },
                secret,
            );
            userInfo = {
                id: 'env-admin',
                username: envUser,
                displayName: 'Administrateur',
                role: 'admin',
                permissions: ALL_PERMISSIONS,
            };
        }

        const cookieStore = await cookies();
        cookieStore.set('admin_session', token!, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        });

        return NextResponse.json({ ok: true, user: userInfo! });
    } catch (err) {
        console.error('[POST /api/admin/auth]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}

// DELETE /api/admin/auth — Logout
export async function DELETE() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('admin_session');
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[DELETE /api/admin/auth]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}

// GET /api/admin/auth — Current user info
export async function GET(req: Request) {
    try {
        const cookieHeader = req.headers.get('cookie') ?? '';
        let token: string | null = null;
        for (const part of cookieHeader.split(';')) {
            const [key, ...rest] = part.trim().split('=');
            if (key.trim() === 'admin_session') {
                token = decodeURIComponent(rest.join('='));
                break;
            }
        }

        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }

        const payload = await validateSession(token);
        if (!payload) {
            return NextResponse.json({ error: 'Session expirée' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: payload.userId,
                username: payload.username,
                displayName: payload.displayName,
                role: payload.role,
                permissions: payload.permissions,
            },
        });
    } catch (err) {
        console.error('[GET /api/admin/auth]', err);
        return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
    }
}
