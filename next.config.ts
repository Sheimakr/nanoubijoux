import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    // Whitelist image hosts for next/image. Anything not listed here
    // would throw "hostname not configured under images" at runtime.
    remotePatterns: [
      // Product + blog images uploaded to Supabase Storage.
      { protocol: 'https', hostname: '*.supabase.co' },
      // Unsplash placeholders used for the seeded luxury-jewelry products;
      // swap/remove when real product shots are uploaded.
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    // Modern formats first — next/image will serve AVIF/WebP when the
    // browser accepts them, fallback to the original.
    formats: ['image/avif', 'image/webp'],
  },
  // Eagerly optimize heavy barrel imports — trims client JS notably.
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default withNextIntl(nextConfig);
