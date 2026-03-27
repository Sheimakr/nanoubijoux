/**
 * admin-auth.ts — Multi-user admin authentication library.
 *
 * Adapted from LanciFast reference. Uses Web Crypto API throughout
 * for Edge Runtime compatibility. No Node.js-specific APIs.
 *
 * Tables: admin_users, admin_sessions (separate from Supabase Auth).
 */

import { adminSupabase as supabase } from './admin-supabase';

// ─── Permission Definitions ───────────────────────────────────────────────────

export type Permission =
    | 'orders:view'
    | 'orders:edit'
    | 'orders:delete'
    | 'orders:ship'
    | 'products:manage'
    | 'categories:manage'
    | 'pixels:manage'
    | 'delivery:manage'
    | 'settings:manage'
    | 'users:manage'
    | 'reports:view';

export type UserRole = 'admin' | 'agent' | 'custom';

export const ALL_PERMISSIONS: Permission[] = [
    'orders:view',
    'orders:edit',
    'orders:delete',
    'orders:ship',
    'products:manage',
    'categories:manage',
    'pixels:manage',
    'delivery:manage',
    'settings:manage',
    'users:manage',
    'reports:view',
];

export const AGENT_DEFAULT_PERMISSIONS: Permission[] = [
    'orders:view',
    'orders:edit',
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppUser {
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
    permissions: Permission[];
    active: boolean;
    createdAt: string;
}

export interface JWTPayload {
    userId: string;
    username: string;
    displayName: string;
    role: UserRole;
    permissions: Permission[];
    exp: number;
    iat: number;
}

export interface CreateUserData {
    username: string;
    password: string;
    displayName?: string;
    role?: UserRole;
    permissions?: Permission[];
    createdBy?: string;
}

export interface UpdateUserData {
    displayName?: string;
    role?: UserRole;
    permissions?: Permission[];
    active?: boolean;
    password?: string;
}

// ─── Web Crypto Password Hashing (PBKDF2) ─────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = bufToHex(saltBytes);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(plain),
        'PBKDF2',
        false,
        ['deriveBits'],
    );

    const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations: 100_000, hash: 'SHA-256' },
        keyMaterial,
        256,
    );

    const hash = bufToHex(new Uint8Array(derived));
    return `${salt}:${hash}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
    const colonIdx = stored.indexOf(':');
    if (colonIdx === -1) return false;

    const saltHex = stored.slice(0, colonIdx);
    const expectedHash = stored.slice(colonIdx + 1);
    const saltBytes = hexToBuf(saltHex);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(plain),
        'PBKDF2',
        false,
        ['deriveBits'],
    );

    const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: new Uint8Array(saltBytes.buffer as ArrayBuffer), iterations: 100_000, hash: 'SHA-256' },
        keyMaterial,
        256,
    );

    const actualHash = bufToHex(new Uint8Array(derived));
    return constantTimeEqual(actualHash, expectedHash);
}

// ─── JWT Utilities (HMAC-SHA256, Edge-compatible) ─────────────────────────────

function base64urlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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

async function getHmacKey(secret: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
    );
}

export async function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
        ...payload,
        iat: now,
        exp: now + 60 * 60 * 24, // 24 hours
    };

    const header = base64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
    const body = base64urlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));
    const signingInput = `${header}.${body}`;

    const key = await getHmacKey(secret);
    const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));

    const signature = base64urlEncode(new Uint8Array(signatureBytes));
    return `${signingInput}.${signature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [header, body, signature] = parts;
        const signingInput = `${header}.${body}`;

        const key = await getHmacKey(secret);
        const sigBytes = base64urlDecode(signature);

        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            sigBytes.buffer as ArrayBuffer,
            new TextEncoder().encode(signingInput),
        );

        if (!valid) return null;

        const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(body))) as JWTPayload;

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) return null;

        return payload;
    } catch {
        return null;
    }
}

// ─── Session Management ───────────────────────────────────────────────────────

export async function createSession(user: AppUser): Promise<string> {
    const secret = process.env.ADMIN_SECRET || 'nanobijoux_secret_key_2026';

    const effectivePermissions: Permission[] =
        user.role === 'admin' ? ALL_PERMISSIONS : user.permissions;

    return createJWT(
        {
            userId: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
            permissions: effectivePermissions,
        },
        secret,
    );
}

export async function validateSession(token: string): Promise<JWTPayload | null> {
    const secret = process.env.ADMIN_SECRET || 'nanobijoux_secret_key_2026';
    return verifyJWT(token, secret);
}

// ─── Database: Admin User Operations ──────────────────────────────────────────

function dbToUser(row: Record<string, unknown>): AppUser {
    return {
        id: row.id as string,
        username: row.username as string,
        displayName: (row.display_name ?? '') as string,
        role: (row.role ?? 'agent') as UserRole,
        permissions: (row.permissions ?? []) as Permission[],
        active: row.active as boolean,
        createdAt: row.created_at as string,
    };
}

export async function getUserByUsername(username: string): Promise<(AppUser & { passwordHash: string }) | null> {
    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('active', true)
        .single();

    if (error || !data) return null;

    return {
        ...dbToUser(data as Record<string, unknown>),
        passwordHash: (data as Record<string, unknown>).password_hash as string,
    };
}

export async function getUserById(id: string): Promise<AppUser | null> {
    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) return null;
    return dbToUser(data as Record<string, unknown>);
}

export async function listUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
        .from('admin_users')
        .select('id, username, display_name, role, permissions, active, created_at')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[listUsers]', error);
        return [];
    }

    return (data ?? []).map(row => dbToUser(row as Record<string, unknown>));
}

export async function createUser(data: CreateUserData): Promise<AppUser | null> {
    const passwordHash = await hashPassword(data.password);

    const effectivePermissions: Permission[] =
        data.role === 'admin'
            ? ALL_PERMISSIONS
            : data.role === 'agent'
            ? AGENT_DEFAULT_PERMISSIONS
            : (data.permissions ?? []);

    const row = {
        username: data.username,
        password_hash: passwordHash,
        display_name: data.displayName ?? data.username,
        role: data.role ?? 'agent',
        permissions: effectivePermissions,
        active: true,
        created_by: data.createdBy ?? null,
    };

    const { data: inserted, error } = await supabase
        .from('admin_users')
        .insert(row)
        .select()
        .single();

    if (error) {
        console.error('[createUser]', error);
        return null;
    }

    return dbToUser(inserted as Record<string, unknown>);
}

export async function updateUser(id: string, updates: UpdateUserData): Promise<AppUser | null> {
    const row: Record<string, unknown> = {};

    if (updates.displayName !== undefined) row.display_name = updates.displayName;
    if (updates.role !== undefined) row.role = updates.role;
    if (updates.active !== undefined) row.active = updates.active;

    if (updates.permissions !== undefined) {
        row.permissions = updates.role === 'admin'
            ? ALL_PERMISSIONS
            : updates.permissions;
    } else if (updates.role === 'admin') {
        row.permissions = ALL_PERMISSIONS;
    } else if (updates.role === 'agent') {
        row.permissions = AGENT_DEFAULT_PERMISSIONS;
    }

    if (updates.password !== undefined) {
        row.password_hash = await hashPassword(updates.password);
    }

    if (Object.keys(row).length === 0) {
        return getUserById(id);
    }

    const { data, error } = await supabase
        .from('admin_users')
        .update(row)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[updateUser]', error);
        return null;
    }

    return dbToUser(data as Record<string, unknown>);
}

export async function deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('admin_users')
        .update({ active: false })
        .eq('id', id);

    if (error) {
        console.error('[deleteUser]', error);
        return false;
    }
    return true;
}

export async function countUsers(): Promise<number> {
    const { count, error } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true });

    if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
            throw new Error('admin_users table does not exist');
        }
        return 0;
    }
    return count ?? 0;
}

export async function bootstrapAdminIfNeeded(): Promise<AppUser | null> {
    const total = await countUsers();
    if (total > 0) return null;

    const username = process.env.ADMIN_USER || 'admin';
    const password = process.env.ADMIN_PASS || 'admin123';

    return createUser({
        username,
        password,
        displayName: 'Administrateur',
        role: 'admin',
        permissions: ALL_PERMISSIONS,
    });
}

// ─── Utility Helpers ──────────────────────────────────────────────────────────

function bufToHex(buf: Uint8Array): string {
    return Array.from(buf)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBuf(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}
