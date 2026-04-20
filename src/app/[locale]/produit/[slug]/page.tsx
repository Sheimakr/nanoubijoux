import type { Metadata } from 'next';
import { getProductBySlugServer } from '@/lib/supabase/server-queries';
import { buildProductMetadata } from '@/lib/metadata';
import ProductView from './product-view';

/**
 * Route segment for /[locale]/produit/[slug].
 *
 * This file is intentionally a Server Component so we can export
 * `generateMetadata` — the existing interactive UI lives in
 * ./product-view.tsx (still 'use client').
 *
 * Server fetch → metadata only. The client view fetches again on mount
 * for now; de-duping both into a single fetch is a possible follow-up
 * but keeps this PR surgical.
 */

type Locale = 'fr' | 'ar' | 'en';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

/** Per-page SEO metadata: unique <title>, description, og + hreflang. */
export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlugServer(slug);
  return buildProductMetadata(product, (locale as Locale) ?? 'fr');
}

export default function Page() {
  // ProductView is a 'use client' component that handles its own
  // data fetching + local UI state. Rendering it from a Server
  // Component is fine — Next serializes the boundary.
  return <ProductView />;
}
