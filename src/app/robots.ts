import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nanobijoux.dz';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/mon-compte/', '/commande/', '/panier/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
