import { createClient } from './server';
import type { Product, Category } from '@/types';

// ============================================
// Server-side queries (for SSR pages)
// ============================================

export async function getProductsServer(options?: {
  categorySlug?: string;
  featured?: boolean;
  isNew?: boolean;
  limit?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*)
    `);

  if (options?.featured) query = query.eq('is_featured', true);
  if (options?.isNew) query = query.eq('is_new', true);
  if (options?.limit) query = query.limit(options.limit);

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return [];
  return (data || []) as Product[];
}

export async function getCategoriesServer() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select(`*, products(count)`)
    .order('sort_order');

  if (error) return [];

  return (data || []).map((cat: any) => ({
    ...cat,
    product_count: cat.products?.[0]?.count || 0,
  }));
}

export async function getProductBySlugServer(slug: string) {
  const supabase = await createClient();
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

export async function getWilayasServer() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('wilayas')
    .select('*')
    .order('id');

  if (error) return [];
  return data;
}

/**
 * Server-side blog post fetch by slug. Used by the /blog/[slug] route
 * segment for generateMetadata — the client view still fetches on its
 * own for hydration. Returns null if missing / unpublished.
 */
export async function getBlogPostBySlugServer(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .maybeSingle();

  if (error) return null;
  return data;
}
