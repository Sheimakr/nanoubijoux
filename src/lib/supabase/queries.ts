import { createClient } from './client';
import type { Product, Category, Brand, Material } from '@/types';

const supabase = createClient();

// ============================================
// Categories
// ============================================
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data as Category[];
}

export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as Category;
}

// ============================================
// Brands
// ============================================
export async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data as Brand[];
}

// ============================================
// Materials (Matières) — public read
// ============================================
export async function getMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Material[];
}

// ============================================
// Products
// ============================================
export async function getProducts(options?: {
  category?: string;
  categoryId?: number;
  brand?: string;
  brandId?: number;
  featured?: boolean;
  isNew?: boolean;
  onSale?: boolean;
  priceMin?: number;
  priceMax?: number;
  material?: string;        // legacy — matches products.material (text)
  materialId?: number;      // current  — matches products.material_id (FK)
  limit?: number;
  offset?: number;
  sort?: string;
  search?: string;
}) {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      brand:brands(*),
      images:product_images(*)
    `);

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.brandId) {
    query = query.eq('brand_id', options.brandId);
  }

  if (options?.featured) {
    query = query.eq('is_featured', true);
  }

  if (options?.isNew) {
    query = query.eq('is_new', true);
  }

  if (options?.onSale) {
    query = query.eq('is_on_sale', true);
  }

  if (options?.priceMin) {
    query = query.gte('price', options.priceMin);
  }

  if (options?.priceMax) {
    query = query.lte('price', options.priceMax);
  }

  // Legacy string match (backward compat with products that only have
  // the old `material` text column populated). Safe to remove once all
  // products are migrated to material_id.
  if (options?.material) {
    query = query.eq('material', options.material);
  }

  // New FK-based filter — ties into the materials table.
  if (options?.materialId) {
    query = query.eq('material_id', options.materialId);
  }

  if (options?.search) {
    query = query.or(`name_fr.ilike.%${options.search}%,name_en.ilike.%${options.search}%,name_ar.ilike.%${options.search}%`);
  }

  // Sorting
  switch (options?.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 12) - 1);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as Product[];
}

export async function getFeaturedProducts(limit = 4) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as Product[];
}

export async function getNewProducts(limit = 4) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `)
    .eq('is_new', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as Product[];
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      brand:brands(*),
      images:product_images(*),
      variants:product_variants(*)
    `)
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data as Product;
}

export async function getProductsByCategory(categoryId: number, limit = 8) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `)
    .eq('category_id', categoryId)
    .limit(limit);

  if (error) throw error;
  return (data || []) as Product[];
}

// ============================================
// Wilayas
// ============================================
export async function getWilayas() {
  const { data, error } = await supabase
    .from('wilayas')
    .select('*')
    .order('id');

  if (error) throw error;
  return data;
}

// ============================================
// Orders
// ============================================
export async function createOrder(order: {
  full_name: string;
  phone: string;
  email?: string;
  wilaya_id: number;
  commune: string;
  address_line: string;
  notes?: string;
  payment_method: string;
  delivery_type?: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  // Caller should pass this explicitly from their auth store to avoid
  // the client-side Supabase session cookie being out of sync.
  // Optional fallback to supabase.auth.getUser() below.
  user_id?: string | null;
  items: {
    product_id: string;
    variant_id?: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string;
    product_image?: string;
    product_sku?: string;
  }[];
}) {
  const { items, user_id: callerUserId, ...orderData } = order;

  // Prefer the caller-supplied user_id (reliable — comes from whatever
  // auth store the UI trusts). Fall back to the session lookup only if
  // the caller didn't pass one. Guest checkouts → user_id stays null.
  let effectiveUserId: string | undefined = callerUserId ?? undefined;
  if (!effectiveUserId) {
    const { data: { user } } = await supabase.auth.getUser();
    effectiveUserId = user?.id;
  }

  const insertData = effectiveUserId
    ? { ...orderData, user_id: effectiveUserId }
    : orderData;

  // Insert order
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert(insertData)
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order items
  const orderItems = items.map((item) => ({
    ...item,
    order_id: newOrder.id,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  return newOrder;
}

// ============================================
// Newsletter
// ============================================
export async function subscribeNewsletter(email: string) {
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email: email.toLowerCase() });

  if (error) {
    if (error.code === '23505') throw new Error('Vous êtes déjà inscrit(e) !');
    throw error;
  }
}

// ============================================
// Contact Form
// ============================================
export async function sendContactMessage(data: { name: string; email?: string; phone?: string; message: string }) {
  const { error } = await supabase
    .from('contact_messages')
    .insert(data);

  if (error) throw error;
}

// ============================================
// Coupon Validation
// ============================================
export async function validateCoupon(code: string, subtotal: number) {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) throw new Error('Code promo invalide');

  const now = new Date().toISOString();
  if (data.starts_at && data.starts_at > now) throw new Error('Code promo pas encore actif');
  if (data.expires_at && data.expires_at < now) throw new Error('Code promo expiré');
  if (data.usage_limit > 0 && data.used_count >= data.usage_limit) throw new Error('Code promo épuisé');
  if (data.min_order_amount && subtotal < data.min_order_amount) {
    throw new Error(`Commande minimum: ${data.min_order_amount} DA`);
  }

  const discountAmount = data.type === 'percentage'
    ? Math.round(subtotal * data.value / 100)
    : data.value;

  return { coupon: data, discountAmount };
}

export async function incrementCouponUsage(couponId: string) {
  // Try RPC first, fall back to manual increment
  const { error } = await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });
  if (error) {
    // Fallback: manual increment
    const { data } = await supabase.from('coupons').select('used_count').eq('id', couponId).single();
    if (data) {
      await supabase.from('coupons').update({ used_count: (data.used_count || 0) + 1 }).eq('id', couponId);
    }
  }
}

// ============================================
// Product counts per category
// ============================================
export async function getCategoriesWithCounts() {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      products(count)
    `)
    .order('sort_order');

  if (error) throw error;

  return (data || []).map((cat: any) => ({
    ...cat,
    product_count: cat.products?.[0]?.count || 0,
  }));
}

// ============================================
// Blog (public)
// ============================================
export async function getPublishedBlogPosts() {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getBlogPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .single();

  if (error) return null;
  return data;
}
