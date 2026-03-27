'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { SectionHeading } from '@/components/ui/section-heading';
import { ProductCard } from '@/components/shop/product-card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import type { Product } from '@/types';

interface ProductCarouselProps {
  label: string;
  title: string;
  products: Product[];
}

function ProductCarousel({ label, title, products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tCommon = useTranslations('common');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading label={label} title={title} />

        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-border flex items-center justify-center text-dark hover:bg-cream transition-colors hidden sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-border flex items-center justify-center text-dark hover:bg-cream transition-colors hidden sm:flex"
          >
            <ChevronRight size={18} />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, index) => (
              <div key={product.id} className="flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] snap-start">
                <ProductCard product={product} index={index} />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/boutique">
            <Button variant="outline" size="md" className="group">
              {tCommon('seeAll')}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function FeaturedProducts({
  bijouxProducts,
  accessoireProducts,
}: {
  bijouxProducts: Product[];
  accessoireProducts: Product[];
}) {
  const t = useTranslations('home');

  return (
    <>
      <ProductCarousel
        label={t('collectionLabel')}
        title={t('bijouxTitle')}
        products={bijouxProducts}
      />
      <ProductCarousel
        label={t('collectionLabel2')}
        title={t('accessoiresTitle')}
        products={accessoireProducts}
      />
    </>
  );
}
