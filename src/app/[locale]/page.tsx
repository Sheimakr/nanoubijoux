import { HeroSlider } from '@/components/home/hero-slider';
import { CategoryGrid } from '@/components/home/category-grid';
import { FeaturedProducts } from '@/components/home/featured-products';
import { BrandPromises } from '@/components/home/brand-promises';
import { PopularProducts } from '@/components/home/popular-products';
import { BrandsGrid } from '@/components/home/brands-grid';
import { InstagramFeed } from '@/components/home/instagram-feed';
import { Newsletter } from '@/components/home/newsletter';
import { getProductsServer, getCategoriesServer } from '@/lib/supabase/server-queries';

export default async function HomePage() {
  const [categories, featuredProducts, accessoireProducts] = await Promise.all([
    getCategoriesServer(),
    getProductsServer({ featured: true, limit: 8 }),
    getProductsServer({ isNew: true, limit: 8 }),
  ]);

  return (
    <>
      <HeroSlider />
      <CategoryGrid categories={categories} />
      <FeaturedProducts
        bijouxProducts={featuredProducts}
        accessoireProducts={accessoireProducts}
      />
      <BrandPromises />
      <PopularProducts />
      <BrandsGrid />
      <InstagramFeed />
      <Newsletter />
    </>
  );
}
