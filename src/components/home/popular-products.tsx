'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function PopularProducts() {
  const t = useTranslations('home');

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="aspect-[4/5] bg-cream overflow-hidden"
          >
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: 'url(/images/popular-banner.jpg)' }}
            />
            {/* Fallback gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-cream" />
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="py-6"
          >
            <p className="text-sm font-semibold text-gold uppercase tracking-widest mb-3">
              {t('popularLabel')}
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-dark mb-4 leading-tight">
              {t('popularTitle')}
            </h2>
            <p className="text-text-body text-base leading-relaxed mb-8">
              {t('popularDesc')}
            </p>
            <Link href="/boutique">
              <Button size="lg" variant="primary" className="group">
                {t('heroCta')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
