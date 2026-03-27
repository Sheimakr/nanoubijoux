/**
 * permissions.ts — Permission helpers for API route handlers.
 *
 * Runs in Node.js route handlers (not Edge). For each authenticated
 * request, the middleware attaches user info as request headers.
 */

import { validateSession } from './admin-auth';
import type { JWTPayload, Permission } from './admin-auth';

export type { JWTPayload, Permission };

/**
 * Extract and validate the current admin user from request headers
 * (set by middleware) or from the admin_session JWT cookie.
 */
export async function getUserFromRequest(request: Request): Promise<JWTPayload | null> {
    // Try request headers set by middleware first
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as JWTPayload['role'] | null;
    const userPermissionsHeader = request.headers.get('x-user-permissions');
    const username = request.headers.get('x-user-username') ?? '';
    const displayName = request.headers.get('x-user-display-name') ?? '';

    if (userId && userRole) {
        let permissions: Permission[] = [];
        try {
            permissions = userPermissionsHeader
                ? (JSON.parse(userPermissionsHeader) as Permission[])
                : [];
        } catch {
            permissions = [];
        }

        return {
            userId,
            username,
            displayName,
            role: userRole,
            permissions,
            exp: 0,
            iat: 0,
        };
    }

    // Fallback: parse cookie directly
    const cookieHeader = request.headers.get('cookie') ?? '';
    const token = parseCookieValue(cookieHeader, 'admin_session');
    if (!token) return null;

    return validateSession(token);
}

export function hasPermission(user: JWTPayload, permission: Permission): boolean {
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
}

export async function requirePermission(
    request: Request,
    permission: Permission,
): Promise<JWTPayload> {
    const user = await getUserFromRequest(request);

    if (!user) {
        throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!hasPermission(user, permission)) {
        throw new Response(JSON.stringify({ error: 'Forbidden: insufficient permissions' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    return user;
}

function parseCookieValue(cookieHeader: string, name: string): string | null {
    for (const part of cookieHeader.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key.trim() === name) {
            return decodeURIComponent(rest.join('='));
        }
    }
    return null;
}
