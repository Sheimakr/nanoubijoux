import { vi } from 'vitest';
import { createMockSupabase } from './helpers/mock-supabase';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.ADMIN_SECRET = 'test-admin-secret';

// Shared mock data
export const mockData: Record<string, any[]> = {
  products: [{ id: 1, name_fr: 'Bracelet Test', price: 1000, slug: 'bracelet-test', stock_quantity: 10 }],
  categories: [{ id: 1, name_fr: 'Bracelets', slug: 'bracelets', sort_order: 1 }],
  brands: [{ id: 1, name: 'Cartier', slug: 'cartier', sort_order: 1 }],
  orders: [{ id: 1, status: 'pending', total: 3000, created_at: '2026-01-01' }],
  order_items: [],
  user_profiles: [{ id: 'u1', first_name: 'Test', last_name: 'User', role: 'admin' }],
  coupons: [{ id: 1, code: 'SUMMER10', type: 'percentage', value: 10, is_active: true }],
  blog_posts: [{ id: 1, title_fr: 'Test Post', slug: 'test-post', published_at: '2026-01-01' }],
  wilayas: [{ id: 16, name_fr: 'Alger', shipping_fee: 400 }],
  settings: [{ id: 1, store_name: 'Nano Bijoux', phone: '+213 549 63 12 36' }],
  newsletter_subscribers: [],
  contact_messages: [],
  product_images: [],
  admin_users: [],
};

const mockSupabase = createMockSupabase(mockData);

// Mock all Supabase client imports
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

vi.mock('@/lib/supabase/admin-client', () => ({
  createAdminClient: () => mockSupabase,
}));

// Mock window.Image for image compression
class MockImage {
  width = 100;
  height = 100;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_: string) {
    setTimeout(() => this.onload?.(), 0);
  }
}
(global as any).Image = MockImage;

// Mock fetch globally
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({}),
});
