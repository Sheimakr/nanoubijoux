import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nanobijoux.dz';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['fr', 'ar', 'en'];

  const staticPages = [
    '',
    '/boutique',
    '/a-propos',
    '/contact',
    '/blog',
    '/livraison',
    '/connexion',
    '/inscription',
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1.0 : 0.8,
      });
    }
  }

  // Dynamic product pages
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: products } = await supabase
      .from('products')
      .select('slug, updated_at');

    if (products) {
      for (const product of products) {
        for (const locale of locales) {
          entries.push({
            url: `${BASE_URL}/${locale}/produit/${product.slug}`,
            lastModified: new Date(product.updated_at),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }
    }
  } catch {
    // Silently fail if DB unavailable during build
  }

  return entries;
}
