/**
 * Fully chainable Supabase mock that supports all query builder methods.
 */
import { vi } from 'vitest';

export function createMockSupabase(mockData: Record<string, any[]> = {}) {
  function createChainableQuery(table: string) {
    const self: any = {
      select: vi.fn(() => self),
      insert: vi.fn((data: any) => {
        const newItem = { id: Date.now(), ...data };
        mockData[table]?.push(newItem);
        self._lastInserted = newItem;
        return self;
      }),
      update: vi.fn(() => self),
      delete: vi.fn(() => self),
      upsert: vi.fn(() => self),
      eq: vi.fn(() => self),
      neq: vi.fn(() => self),
      gt: vi.fn(() => self),
      gte: vi.fn(() => self),
      lt: vi.fn(() => self),
      lte: vi.fn(() => self),
      like: vi.fn(() => self),
      ilike: vi.fn(() => self),
      is: vi.fn(() => self),
      in: vi.fn(() => self),
      not: vi.fn(() => self),
      or: vi.fn(() => self),
      filter: vi.fn(() => self),
      order: vi.fn(() => self),
      limit: vi.fn(() => self),
      range: vi.fn(() => self),
      single: vi.fn().mockResolvedValue({ data: mockData[table]?.[0] ?? null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: mockData[table]?.[0] ?? null, error: null }),
      then: vi.fn((resolve: any) => {
        return Promise.resolve({ data: mockData[table] ?? [], error: null, count: mockData[table]?.length ?? 0 }).then(resolve);
      }),
      _lastInserted: null,
    };

    // Make the query thenable (acts as a promise)
    Object.defineProperty(self, Symbol.toStringTag, { value: 'Promise' });

    return self;
  }

  return {
    from: vi.fn((table: string) => createChainableQuery(table)),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/product-images/${path}` } })),
        remove: vi.fn().mockResolvedValue({ error: null }),
      })),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}
