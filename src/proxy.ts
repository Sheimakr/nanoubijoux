import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// ─── Admin JWT Permission → Route mapping ─────────────────────────────────────

const ROUTE_PERMISSIONS: Array<{ prefix: string; permission: string }> = [
  { prefix: '/admin/settings', permission: 'settings:manage' },
  // UI route was renamed from /admin/users → /admin/admins in phase 4b.
  // The API path (/api/admin/users, below) is kept for backward compatibility.
  { prefix: '/admin/admins', permission: 'users:manage' },
  { prefix: '/admin/pixels', permission: 'pixels:manage' },
  { prefix: '/admin/delivery', permission: 'delivery:manage' },
  { prefix: '/admin/produits', permission: 'products:manage' },
  { prefix: '/admin/categories', permission: 'categories:manage' },
  // Super-admins only — agents typing /admin/coupons directly get redirected.
  { prefix: '/admin/coupons', permission: 'coupons:manage' },
  { prefix: '/api/admin/users', permission: 'users:manage' },
  { prefix: '/api/admin/settings', permission: 'settings:manage' },
  { prefix: '/api/admin/pixels', permission: 'pixels:manage' },
  { prefix: '/api/admin/delivery', permission: 'delivery:manage' },
  { prefix: '/api/admin/products', permission: 'products:manage' },
];

// ─── Edge-compatible JWT verification ─────────────────────────────────────────

interface JWTPayload {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  permissions: string[];
  exp: number;
  iat: number;
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLen);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyJWTEdge(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const signingInput = `${header}.${body}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const sigBytes = base64urlDecode(signature);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(signingInput),
    );

    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(body)),
    ) as JWTPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── Proxy entry point ───────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin login page — no auth required
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Admin panel pages — JWT auth + permissions
  if (pathname.startsWith('/admin')) {
    return handleAdminAuth(request);
  }

  // Admin API routes — JWT auth + permissions
  if (pathname.startsWith('/api/admin')) {
    return handleAdminApiAuth(request);
  }

  // All other API routes — skip i18n, pass through directly
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Locale-prefixed API routes (e.g. /fr/api/communes → redirect to /api/communes)
  const localeApiMatch = pathname.match(/^\/(fr|ar|en)(\/api\/.*)$/);
  if (localeApiMatch) {
    return NextResponse.redirect(new URL(localeApiMatch[2], request.url));
  }

  // All other routes — handle i18n
  return intlMiddleware(request);
}

// ─── Admin page auth (redirects to /admin/login) ─────────────────────────────

async function handleAdminAuth(request: NextRequest) {
  const session = request.cookies.get('admin_session')?.value;

  if (!session) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const secret = process.env.ADMIN_SECRET || 'nanobijoux_secret_key_2026';
  const payload = await verifyJWTEdge(session, secret);

  if (!payload) {
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('admin_session');
    return response;
  }

  const { pathname } = request.nextUrl;

  // Check route-specific permissions
  for (const { prefix, permission } of ROUTE_PERMISSIONS) {
    if (pathname.startsWith(prefix)) {
      const isAdmin = payload.role === 'admin';
      const hasPerm = isAdmin || payload.permissions.includes(permission);
      if (!hasPerm) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      break;
    }
  }

  // Attach user info to forwarded request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-username', payload.username);
  requestHeaders.set('x-user-display-name', payload.displayName ?? '');
  requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// ─── Admin API auth (returns 401/403 JSON) ────────────────────────────────────

async function handleAdminApiAuth(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth endpoints are public
  if (pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next();
  }

  const session = request.cookies.get('admin_session')?.value;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const secret = process.env.ADMIN_SECRET || 'nanobijoux_secret_key_2026';
  const payload = await verifyJWTEdge(session, secret);

  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check route-specific permissions
  for (const { prefix, permission } of ROUTE_PERMISSIONS) {
    if (pathname.startsWith(prefix)) {
      const isAdmin = payload.role === 'admin';
      const hasPerm = isAdmin || payload.permissions.includes(permission);
      if (!hasPerm) {
        return NextResponse.json(
          { error: 'Forbidden: insufficient permissions' },
          { status: 403 },
        );
      }
      break;
    }
  }

  // Attach user info to forwarded request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-username', payload.username);
  requestHeaders.set('x-user-display-name', payload.displayName ?? '');
  requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
