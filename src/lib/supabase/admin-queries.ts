import { createClient } from './client';
import type { Product, Category, Brand, Material, Order, Coupon, BlogPost } from '@/types';

const supabase = createClient();

// ============================================
// Image Upload
// ============================================

/** Compress image to max 1200px wide and ~70% quality before uploading */
async function compressImage(file: File, maxWidth = 1200, quality = 0.75): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', quality);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const path = `products/${fileName}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, compressed, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });

  if (error) throw error;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(path);

  return data.publicUrl;
}

export async function deleteStorageImage(url: string) {
  const path = url.split('/product-images/')[1];
  if (!path) return;
  await supabase.storage.from('product-images').remove([path]);
}

// ============================================
// Admin Auth
// ============================================
export async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role === 'admin';
}

// ============================================
// Dashboard Stats
// ============================================
export async function getDashboardStats() {
  const [products, orders, customers, categories] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id, total, status, created_at'),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
  ]);

  const allOrders = orders.data || [];
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = allOrders.filter(o => o.status === 'pending').length;

  return {
    totalProducts: products.count || 0,
    totalOrders: allOrders.length,
    totalRevenue,
    totalCustomers: customers.count || 0,
    totalCategories: categories.count || 0,
    pendingOrders,
    recentOrders: allOrders.slice(0, 5),
  };
}

// ============================================
// Products — Admin CRUD
// ============================================
export async function getAdminProducts(options?: {
  search?: string;
  categoryId?: number;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('products')
    .select(`*, category:categories(id, name_fr), brand:brands(id, name), images:product_images(*)`, { count: 'exact' });

  if (options?.search) {
    query = query.or(`name_fr.ilike.%${options.search}%,sku.ilike.%${options.search}%`);
  }
  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  query = query.order('created_at', { ascending: false });

  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { products: data || [], total: count || 0 };
}

export async function getAdminProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`*, category:categories(id, name_fr), brand:brands(id, name), images:product_images(*)`)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(product: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id: string | number, updates: Partial<Product>) {
  // Remove undefined/relation fields that shouldn't be sent to DB
  const cleanUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && !['category', 'brand', 'images', 'variants', 'reviews'].includes(key)) {
      cleanUpdates[key] = value;
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update(cleanUpdates)
    .eq('id', id)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Produit introuvable ou mise à jour refusée');
  }
  return data[0];
}

export async function deleteProduct(id: string | number) {
  // Delete images first
  await supabase.from('product_images').delete().eq('product_id', id);
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// Product Images
// ============================================
export async function addProductImage(productId: string | number, url: string, isPrimary = false) {
  const { data, error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, url, is_primary: isPrimary })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProductImage(id: string | number) {
  const { error } = await supabase.from('product_images').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// Categories — Admin CRUD
// ============================================
export async function createCategory(category: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: string | number, updates: Partial<Category>) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string | number) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// Brands — Admin CRUD
// ============================================
export async function createBrand(brand: Partial<Brand>) {
  const { data, error } = await supabase
    .from('brands')
    .insert(brand)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBrand(id: string | number, updates: Partial<Brand>) {
  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBrand(id: string | number) {
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// Materials (Matières) — Admin CRUD
// Mirrors the brand CRUD pattern: simple name + slug.
// ============================================
export async function getAllMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Material[];
}

export async function createMaterial(material: Partial<Material>) {
  const { data, error } = await supabase
    .from('materials')
    .insert(material)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMaterial(id: string | number, updates: Partial<Material>) {
  const { data, error } = await supabase
    .from('materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMaterial(id: string | number) {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// Orders — Admin
// ============================================
export async function getAllOrders(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('orders')
    .select(`*, items:order_items(*)`, { count: 'exact' });

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }
  if (options?.search) {
    query = query.or(`full_name.ilike.%${options.search}%,phone.ilike.%${options.search}%`);
  }

  query = query.order('created_at', { ascending: false });
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { orders: data || [], total: count || 0 };
}

export async function getOrderById(id: string | number) {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, items:order_items(*)`)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: string | number, status: string, trackingNumber?: string) {
  const updates: Record<string, any> = { status };
  if (trackingNumber) updates.tracking_number = trackingNumber;
  if (status === 'delivered') updates.payment_status = 'paid';

  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// Customers — Admin
// ============================================
export async function getAllCustomers(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' });

  if (options?.search) {
    query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%`);
  }

  query = query.order('created_at', { ascending: false });
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { customers: data || [], total: count || 0 };
}

// ============================================
// Coupons — Admin CRUD
// ============================================
export async function getAllCoupons() {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCoupon(coupon: Partial<Coupon>) {
  // Normalize code to uppercase for consistent matching
  const normalized = { ...coupon };
  if (normalized.code) normalized.code = normalized.code.toUpperCase().trim();

  const { data, error } = await supabase
    .from('coupons')
    .insert(normalized)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCoupon(id: string | number, updates: Partial<Coupon>) {
  const { data, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCoupon(id: string | number) {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// Blog — Admin CRUD
// ============================================
export async function getAllBlogPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createBlogPost(post: Partial<BlogPost>) {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert(post)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBlogPost(id: string | number, updates: Partial<BlogPost>) {
  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBlogPost(id: string | number) {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// Promote user to admin (one-time setup)
// ============================================
export async function promoteToAdmin(userId: string) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ role: 'admin' })
    .eq('id', userId);

  if (error) throw error;
}
