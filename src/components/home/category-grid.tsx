'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryWithCount {
  id: number;
  name_fr: string;
  name_ar: string;
  name_en: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  product_count: number;
}

export function CategoryGrid({ categories }: { categories: CategoryWithCount[] }) {
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);

  const getLocalName = (cat: CategoryWithCount) => {
    if (locale === 'ar') return cat.name_ar;
    if (locale === 'en') return cat.name_en;
    return cat.name_fr;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center text-charcoal hover:text-gold hover:shadow-lg transition-all"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center text-charcoal hover:text-gold hover:shadow-lg transition-all"
        >
          <ChevronRight size={20} />
        </button>

        {/* Scrollable row — no scrollbar */}
        <div
          ref={scrollRef}
          className="flex gap-6 sm:gap-8 lg:gap-10 overflow-x-auto pb-4 px-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center"
            >
              <Link href={`/boutique?category=${cat.slug}`} className="group flex flex-col items-center flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-gold transition-all duration-300 group-hover:shadow-lg">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage: cat.image_url ? `url(${cat.image_url})` : undefined,
                      backgroundColor: !cat.image_url ? '#f5f5f5' : undefined,
                    }}
                  />
                </div>
                <h3 className="mt-3 font-heading text-sm font-semibold text-dark text-center leading-tight">
                  {getLocalName(cat)}
                </h3>
                <p className="text-xs text-text-body mt-0.5">
                  {cat.product_count} {locale === 'ar' ? 'منتج' : locale === 'en' ? 'products' : 'produits'}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
