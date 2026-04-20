import type { Metadata } from 'next';
import { getLocalizedField } from './utils';
import { SITE_NAME, SITE_URL } from './constants';

/**
 * Shared metadata helpers for dynamic pages (product, blog, category).
 *
 * Every helper produces:
 *   - a locale-specific <title> / <description>
 *   - openGraph + twitter tags for social previews
 *   - alternates.canonical + alternates.languages for hreflang
 *
 * Why it matters:
 *   - Per-page unique titles kill the Google duplicate-content penalty
 *     (before this, every /produit/* had identical <title> "Nano Bijoux
 *     | Bijoux & Accessoires").
 *   - hreflang tells Google which URL serves which locale so it can
 *     index all three without treating them as competitors.
 */

type Locale = 'fr' | 'ar' | 'en';

/** Clamp + clean a paragraph for use as a <meta description>. */
function cleanDescription(text: string | null | undefined, max = 160): string {
  if (!text) return '';
  const stripped = text
    .replace(/<[^>]+>/g, '')  // strip HTML tags
    .replace(/\s+/g, ' ')     // collapse whitespace
    .trim();
  if (stripped.length <= max) return stripped;
  return stripped.slice(0, max - 1).trimEnd() + '…';
}

/** Build the alternates.languages map pointing at the same slug in each locale. */
function buildAlternates(pathWithoutLocale: string) {
  return {
    canonical: `${SITE_URL}${pathWithoutLocale}`,
    languages: {
      fr: `${SITE_URL}/fr${pathWithoutLocale}`,
      ar: `${SITE_URL}/ar${pathWithoutLocale}`,
      en: `${SITE_URL}/en${pathWithoutLocale}`,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Product page metadata
// ─────────────────────────────────────────────────────────────────────

export interface ProductMetaRow {
  slug: string;
  name_fr?: string;
  name_ar?: string;
  name_en?: string;
  description_fr?: string;
  description_ar?: string;
  description_en?: string;
  price?: number;
  images?: { url: string }[] | null;
}

export function buildProductMetadata(
  product: ProductMetaRow | null,
  locale: Locale,
): Metadata {
  if (!product) {
    return {
      title: 'Produit introuvable',
      description: 'Ce produit n\'existe plus ou a été retiré du catalogue.',
      robots: { index: false, follow: false },
    };
  }

  const name = getLocalizedField(product, 'name', locale) || 'Bijou';
  const description =
    cleanDescription(getLocalizedField(product, 'description', locale)) ||
    `Découvrez ${name} sur ${SITE_NAME} — livraison dans les 58 wilayas d'Algérie.`;
  const image = product.images?.[0]?.url;
  const path = `/produit/${product.slug}`;

  return {
    title: `${name} — ${SITE_NAME}`,
    description,
    alternates: buildAlternates(path),
    openGraph: {
      type: 'website',
      title: name,
      description,
      url: `${SITE_URL}/${locale}${path}`,
      siteName: SITE_NAME,
      images: image ? [{ url: image, alt: name }] : undefined,
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'en' ? 'en_US' : 'fr_DZ',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Blog post metadata
// ─────────────────────────────────────────────────────────────────────

export interface BlogMetaRow {
  slug: string;
  title_fr?: string;
  title_ar?: string;
  title_en?: string;
  content_fr?: string;
  content_ar?: string;
  content_en?: string;
  featured_image?: string | null;
  published_at?: string | null;
}

export function buildBlogMetadata(
  post: BlogMetaRow | null,
  locale: Locale,
): Metadata {
  if (!post) {
    return {
      title: 'Article introuvable',
      description: 'Cet article n\'est plus disponible.',
      robots: { index: false, follow: false },
    };
  }

  const title = getLocalizedField(post, 'title', locale) || 'Article';
  const description =
    cleanDescription(getLocalizedField(post, 'content', locale)) ||
    `Article du blog ${SITE_NAME}.`;
  const path = `/blog/${post.slug}`;

  return {
    title: `${title} — ${SITE_NAME}`,
    description,
    alternates: buildAlternates(path),
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE_URL}/${locale}${path}`,
      siteName: SITE_NAME,
      images: post.featured_image ? [{ url: post.featured_image, alt: title }] : undefined,
      locale: locale === 'ar' ? 'ar_DZ' : locale === 'en' ? 'en_US' : 'fr_DZ',
      publishedTime: post.published_at ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featured_image ? [post.featured_image] : undefined,
    },
  };
}
