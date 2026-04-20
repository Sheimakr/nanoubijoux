import dynamic from 'next/dynamic';
import { HeroSlider } from '@/components/home/hero-slider';
import { CategoryGrid } from '@/components/home/category-grid';
import { FeaturedProducts } from '@/components/home/featured-products';
import { getProductsServer, getCategoriesServer } from '@/lib/supabase/server-queries';

// Below-the-fold sections are dynamic-imported so the initial JS payload
// stays small. These sections aren't visible on first paint — they only
// need to hydrate when the user scrolls near them. A lightweight skeleton
// matches each section's approximate height to prevent layout shift
// (CLS) while the chunk loads.
const BrandPromises = dynamic(
  () =>
    import('@/components/home/brand-promises').then((m) => ({
      default: m.BrandPromises,
    })),
  {
    loading: () => <SectionSkeleton height="h-24" />,
  },
);

// -------------------------------------------------------------------
// Removed per owner request (date of this change):
//   - "Our Accessories" carousel (second <ProductCarousel> inside
//     FeaturedProducts) — we now pass accessoireProducts={[]} which
//     causes ProductCarousel to return null (self-hiding when empty).
//   - "Most Popular" section  → PopularProducts component
//   - "Our Brand"    section  → BrandsGrid component
// The imports + files still exist; just uncomment the dynamic() and
// the <Component /> to bring them back.
// -------------------------------------------------------------------

// InstagramFeed + Newsletter both removed per owner request.
// Their component files still exist but are no longer imported.

/** Neutral placeholder for dynamic-imported sections. */
function SectionSkeleton({ height }: { height: string }) {
  return (
    <div
      className={`${height} w-full bg-cream/40 animate-pulse`}
      aria-hidden="true"
    />
  );
}

export default async function HomePage() {
  // We no longer fetch the accessoires (new arrivals) list since the
  // Accessories carousel has been removed — keeps data-fetching tight.
  const [categories, featuredProducts] = await Promise.all([
    getCategoriesServer(),
    getProductsServer({ featured: true, limit: 8 }),
  ]);

  return (
    <>
      {/* Above the fold — eagerly loaded */}
      <HeroSlider />
      <CategoryGrid categories={categories} />
      {/* Pass empty accessoireProducts → ProductCarousel self-hides */}
      <FeaturedProducts
        bijouxProducts={featuredProducts}
        accessoireProducts={[]}
      />

      {/* Below the fold — lazy-loaded chunks */}
      <BrandPromises />
    </>
  );
}
