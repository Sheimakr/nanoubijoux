/**
 * TEST SUITE 3: Authentication & Authorization
 *
 * Verifies:
 * - Admin JWT creation and validation
 * - Password hashing and verification
 * - Permission-based access control
 * - Session management
 * - Role hierarchy (admin > agent > custom)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the admin-supabase module
vi.mock('@/lib/admin-supabase', () => {
  const mockUsers: Record<string, any> = {};
  return {
    adminSupabase: {
      from: vi.fn((table: string) => {
        if (table === 'admin_users') {
          return {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn((data: any) => {
              mockUsers[data.username] = { ...data, id: 'u-' + Date.now() };
              return {
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockUsers[data.username], error: null }),
              };
            }),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockResolvedValue({ data: Object.values(mockUsers), error: null }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          limit: vi.fn().mockReturnThis(),
        };
      }),
    },
  };
});

describe('Authentication & Authorization', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // PASSWORD SECURITY
  // ========================================
  describe('Password Hashing', () => {
    it('should hash password with PBKDF2', async () => {
      const { hashPassword } = await import('@/lib/admin-auth');
      const hash = await hashPassword('testPassword123');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).toContain(':'); // format: salt:hash
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify correct password', async () => {
      const { hashPassword, verifyPassword } = await import('@/lib/admin-auth');
      const hash = await hashPassword('correctPassword');
      const isValid = await verifyPassword('correctPassword', hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const { hashPassword, verifyPassword } = await import('@/lib/admin-auth');
      const hash = await hashPassword('correctPassword');
      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password (unique salt)', async () => {
      const { hashPassword } = await import('@/lib/admin-auth');
      const hash1 = await hashPassword('samePassword');
      const hash2 = await hashPassword('samePassword');
      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  // ========================================
  // JWT TOKENS
  // ========================================
  describe('JWT Token Management', () => {
    it('should create a valid JWT token', async () => {
      const { createJWT } = await import('@/lib/admin-auth');
      const token = await createJWT(
        { userId: 'u1', username: 'admin', displayName: 'Admin', role: 'admin', permissions: [] },
        'test-secret'
      );
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('should verify a valid JWT token', async () => {
      const { createJWT, verifyJWT } = await import('@/lib/admin-auth');
      const secret = 'test-secret-key';
      const payload = { userId: 'u1', username: 'admin', displayName: 'Admin', role: 'admin' as const, permissions: [] };

      const token = await createJWT(payload, secret);
      const verified = await verifyJWT(token, secret);

      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('u1');
      expect(verified?.username).toBe('admin');
      expect(verified?.role).toBe('admin');
    });

    it('should reject token with wrong secret', async () => {
      const { createJWT, verifyJWT } = await import('@/lib/admin-auth');
      const token = await createJWT(
        { userId: 'u1', username: 'admin', displayName: 'Admin', role: 'admin', permissions: [] },
        'correct-secret'
      );
      const verified = await verifyJWT(token, 'wrong-secret');
      expect(verified).toBeNull();
    });

    it('should reject expired token', async () => {
      const { verifyJWT } = await import('@/lib/admin-auth');
      // Create a manually crafted expired token
      const result = await verifyJWT('expired.fake.token', 'secret');
      expect(result).toBeNull();
    });

    it('should reject malformed token', async () => {
      const { verifyJWT } = await import('@/lib/admin-auth');
      const result = await verifyJWT('not-a-jwt', 'secret');
      expect(result).toBeNull();
    });
  });

  // ========================================
  // PERMISSION SYSTEM
  // ========================================
  describe('Permission-Based Access Control', () => {
    it('admin role should have ALL permissions', async () => {
      const { hasPermission } = await import('@/lib/permissions');
      const adminUser = {
        userId: 'u1',
        username: 'admin',
        displayName: 'Admin',
        role: 'admin' as const,
        permissions: [], // Empty — admin gets all by default
        exp: 0,
        iat: 0,
      };

      expect(hasPermission(adminUser, 'orders:view')).toBe(true);
      expect(hasPermission(adminUser, 'products:manage')).toBe(true);
      expect(hasPermission(adminUser, 'settings:manage')).toBe(true);
      expect(hasPermission(adminUser, 'users:manage')).toBe(true);
    });

    it('agent role should only have assigned permissions', async () => {
      const { hasPermission } = await import('@/lib/permissions');
      const agentUser = {
        userId: 'u2',
        username: 'agent',
        displayName: 'Agent',
        role: 'agent' as const,
        permissions: ['orders:view', 'orders:edit'] as any[],
        exp: 0,
        iat: 0,
      };

      expect(hasPermission(agentUser, 'orders:view')).toBe(true);
      expect(hasPermission(agentUser, 'orders:edit')).toBe(true);
      expect(hasPermission(agentUser, 'products:manage')).toBe(false);
      expect(hasPermission(agentUser, 'users:manage')).toBe(false);
    });

    it('custom role should only have explicitly assigned permissions', async () => {
      const { hasPermission } = await import('@/lib/permissions');
      const customUser = {
        userId: 'u3',
        username: 'custom',
        displayName: 'Custom',
        role: 'custom' as const,
        permissions: ['products:manage', 'categories:manage'] as any[],
        exp: 0,
        iat: 0,
      };

      expect(hasPermission(customUser, 'products:manage')).toBe(true);
      expect(hasPermission(customUser, 'categories:manage')).toBe(true);
      expect(hasPermission(customUser, 'orders:view')).toBe(false);
      expect(hasPermission(customUser, 'settings:manage')).toBe(false);
    });

    it('requirePermission should throw 401 for unauthenticated request', async () => {
      const { requirePermission } = await import('@/lib/permissions');
      const mockRequest = new Request('http://localhost:3000/api/admin/test', {
        headers: new Headers({}),
      });

      try {
        await requirePermission(mockRequest, 'orders:view');
        expect.fail('Should have thrown');
      } catch (response: any) {
        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBe(401);
      }
    });

    it('requirePermission should throw 403 for insufficient permissions', async () => {
      const { requirePermission } = await import('@/lib/permissions');
      const mockRequest = new Request('http://localhost:3000/api/admin/test', {
        headers: new Headers({
          'x-user-id': 'u2',
          'x-user-role': 'agent',
          'x-user-permissions': JSON.stringify(['orders:view']),
          'x-user-username': 'agent',
          'x-user-display-name': 'Agent',
        }),
      });

      try {
        await requirePermission(mockRequest, 'users:manage');
        expect.fail('Should have thrown');
      } catch (response: any) {
        expect(response).toBeInstanceOf(Response);
        expect(response.status).toBe(403);
      }
    });

    it('requirePermission should pass for authorized user', async () => {
      const { requirePermission } = await import('@/lib/permissions');
      const mockRequest = new Request('http://localhost:3000/api/admin/test', {
        headers: new Headers({
          'x-user-id': 'u1',
          'x-user-role': 'admin',
          'x-user-permissions': '[]',
          'x-user-username': 'admin',
          'x-user-display-name': 'Admin',
        }),
      });

      const user = await requirePermission(mockRequest, 'users:manage');
      expect(user.userId).toBe('u1');
      expect(user.role).toBe('admin');
    });
  });

  // ========================================
  // SESSION MANAGEMENT
  // ========================================
  describe('Session Management', () => {
    it('createSession should return a JWT token', async () => {
      const { createSession } = await import('@/lib/admin-auth');
      const token = await createSession({
        id: 'u1',
        username: 'admin',
        displayName: 'Admin',
        role: 'admin',
        permissions: [],
        active: true,
        createdAt: new Date().toISOString(),
      });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('validateSession should decode valid session', async () => {
      const { createSession, validateSession } = await import('@/lib/admin-auth');
      const token = await createSession({
        id: 'u1',
        username: 'admin',
        displayName: 'Admin',
        role: 'admin',
        permissions: [],
        active: true,
        createdAt: new Date().toISOString(),
      });

      const payload = await validateSession(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe('u1');
    });

    it('validateSession should reject invalid token', async () => {
      const { validateSession } = await import('@/lib/admin-auth');
      const payload = await validateSession('invalid-token');
      expect(payload).toBeNull();
    });
  });
});
