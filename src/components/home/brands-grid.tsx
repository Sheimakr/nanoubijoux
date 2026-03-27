'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/section-heading';
import { BRANDS } from '@/lib/constants';

export function BrandsGrid() {
  const t = useTranslations('home');

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('brands')} />

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-3 sm:grid-cols-5 gap-4"
        >
          {BRANDS.map((brand, index) => (
            <motion.div
              key={brand}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className="aspect-square bg-gray-light flex items-center justify-center p-4 hover:bg-cream transition-colors cursor-pointer"
            >
              <span className="font-heading text-sm sm:text-base font-semibold text-dark/60 text-center leading-tight">
                {brand}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
