import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { TrackingPixels } from '@/components/shared/tracking-pixels';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Nano Bijoux | Bijoux & Accessoires en Algérie',
    template: '%s | Nano Bijoux',
  },
  description: 'Boutique en ligne de bijoux et accessoires en acier inoxydable. Bagues, colliers, bracelets, boucles d\'oreilles. Livraison dans les 58 wilayas d\'Algérie.',
  keywords: ['bijoux', 'accessoires', 'acier inoxydable', 'Algérie', 'colliers', 'bracelets', 'bagues', 'boucles d\'oreilles', 'montres', 'parures', 'nano bijoux'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nanobijoux.dz'),
  openGraph: {
    type: 'website',
    locale: 'fr_DZ',
    alternateLocale: ['ar_DZ', 'en_US'],
    siteName: 'Nano Bijoux',
    title: 'Nano Bijoux | Bijoux & Accessoires en Algérie',
    description: 'Boutique en ligne de bijoux et accessoires en acier inoxydable. Livraison dans les 58 wilayas.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nano Bijoux',
    description: 'Bijoux & Accessoires en Algérie',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    languages: {
      'fr': '/fr',
      'ar': '/ar',
      'en': '/en',
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the current locale from next-intl so the <html> tag advertises the
  // right language (screen readers, SEO) and direction (Arabic → RTL).
  // getLocale() resolves via the middleware that detects /fr|/ar|/en.
  const locale = await getLocale();
  const isRtl = locale === 'ar';

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <TrackingPixels />
      </head>
      <body className="min-h-full flex flex-col bg-white text-charcoal">
        {children}
      </body>
    </html>
  );
}
