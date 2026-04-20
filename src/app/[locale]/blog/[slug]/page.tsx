import type { Metadata } from 'next';
import { getBlogPostBySlugServer } from '@/lib/supabase/server-queries';
import { buildBlogMetadata } from '@/lib/metadata';
import BlogView from './blog-view';

/**
 * Route segment for /[locale]/blog/[slug].
 *
 * Server Component that exports `generateMetadata` for per-article SEO.
 * The existing interactive 'use client' component is untouched, just
 * moved to ./blog-view.tsx and rendered from here.
 */

type Locale = 'fr' | 'ar' | 'en';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getBlogPostBySlugServer(slug);
  return buildBlogMetadata(post, (locale as Locale) ?? 'fr');
}

export default function Page() {
  return <BlogView />;
}
