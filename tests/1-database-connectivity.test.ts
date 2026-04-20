/**
 * TEST SUITE 1: Database Connectivity & Schema Validation
 */

import { describe, it, expect } from 'vitest';

describe('Database Connectivity', () => {

  describe('Supabase Client Creation', () => {
    it('should create a client with from, auth, storage', async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const client = createClient();
      expect(client).toBeDefined();
      expect(client.from).toBeDefined();
      expect(client.auth).toBeDefined();
      expect(client.storage).toBeDefined();
    });
  });

  describe('Query Functions Exist', () => {
    it('queries.ts should export all required functions', async () => {
      const queries = await import('@/lib/supabase/queries');
      expect(queries.getProducts).toBeDefined();
      expect(queries.getCategories).toBeDefined();
      expect(queries.getBrands).toBeDefined();
      expect(queries.getProductBySlug).toBeDefined();
      expect(queries.getFeaturedProducts).toBeDefined();
      expect(queries.getNewProducts).toBeDefined();
      expect(queries.getWilayas).toBeDefined();
      expect(queries.createOrder).toBeDefined();
      expect(queries.validateCoupon).toBeDefined();
      expect(queries.getPublishedBlogPosts).toBeDefined();
      expect(queries.subscribeNewsletter).toBeDefined();
      expect(queries.sendContactMessage).toBeDefined();
    });

    it('admin-queries.ts should export all CRUD functions', async () => {
      const admin = await import('@/lib/supabase/admin-queries');
      // Products
      expect(admin.getAdminProducts).toBeDefined();
      expect(admin.getAdminProductById).toBeDefined();
      expect(admin.createProduct).toBeDefined();
      expect(admin.updateProduct).toBeDefined();
      expect(admin.deleteProduct).toBeDefined();
      // Categories
      expect(admin.createCategory).toBeDefined();
      expect(admin.updateCategory).toBeDefined();
      expect(admin.deleteCategory).toBeDefined();
      // Brands
      expect(admin.createBrand).toBeDefined();
      expect(admin.updateBrand).toBeDefined();
      expect(admin.deleteBrand).toBeDefined();
      // Orders
      expect(admin.getAllOrders).toBeDefined();
      expect(admin.getOrderById).toBeDefined();
      expect(admin.updateOrderStatus).toBeDefined();
      // Coupons
      expect(admin.getAllCoupons).toBeDefined();
      expect(admin.createCoupon).toBeDefined();
      expect(admin.updateCoupon).toBeDefined();
      expect(admin.deleteCoupon).toBeDefined();
      // Blog
      expect(admin.getAllBlogPosts).toBeDefined();
      expect(admin.createBlogPost).toBeDefined();
      expect(admin.updateBlogPost).toBeDefined();
      expect(admin.deleteBlogPost).toBeDefined();
      // Image
      expect(admin.uploadProductImage).toBeDefined();
      expect(admin.deleteStorageImage).toBeDefined();
      // Dashboard
      expect(admin.getDashboardStats).toBeDefined();
    });
  });

  describe('Query Functions Execute Without Errors', () => {
    it('getProducts should execute', async () => {
      const { getProducts } = await import('@/lib/supabase/queries');
      const result = await getProducts({ limit: 10 });
      expect(result).toBeDefined();
    });

    it('getCategories should execute', async () => {
      const { getCategories } = await import('@/lib/supabase/queries');
      const result = await getCategories();
      expect(result).toBeDefined();
    });

    it('getBrands should execute', async () => {
      const { getBrands } = await import('@/lib/supabase/queries');
      const result = await getBrands();
      expect(result).toBeDefined();
    });

    it('getWilayas should execute', async () => {
      const { getWilayas } = await import('@/lib/supabase/queries');
      const result = await getWilayas();
      expect(result).toBeDefined();
    });

    it('getAdminProducts should execute', async () => {
      const { getAdminProducts } = await import('@/lib/supabase/admin-queries');
      const result = await getAdminProducts({ limit: 10 });
      expect(result).toBeDefined();
    });

    it('getAllOrders should execute', async () => {
      const { getAllOrders } = await import('@/lib/supabase/admin-queries');
      const result = await getAllOrders({ limit: 10 });
      expect(result).toBeDefined();
    });

    it('getAllCoupons should execute', async () => {
      const { getAllCoupons } = await import('@/lib/supabase/admin-queries');
      const result = await getAllCoupons();
      expect(result).toBeDefined();
    });

    it('getAllBlogPosts should execute', async () => {
      const { getAllBlogPosts } = await import('@/lib/supabase/admin-queries');
      const result = await getAllBlogPosts();
      expect(result).toBeDefined();
    });

    it('getPublishedBlogPosts should execute', async () => {
      const { getPublishedBlogPosts } = await import('@/lib/supabase/queries');
      const result = await getPublishedBlogPosts();
      expect(result).toBeDefined();
    });

    it('getDashboardStats should execute', async () => {
      const { getDashboardStats } = await import('@/lib/supabase/admin-queries');
      const result = await getDashboardStats();
      expect(result).toBeDefined();
    });
  });
});
