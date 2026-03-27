'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Truck, Sparkles, Gem } from 'lucide-react';

const promises = [
  { key: 'delivery', icon: Truck },
  { key: 'quality', icon: Sparkles },
  { key: 'designs', icon: Gem },
] as const;

export function BrandPromises() {
  const t = useTranslations('home');

  return (
    <section className="py-12 sm:py-16 bg-cream">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {promises.map(({ key, icon: Icon }, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-5 bg-white"
            >
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <Icon size={32} className="text-gold" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold text-dark">
                  {t(`promises.${key}`)}
                </h3>
                <p className="text-sm text-text-body mt-0.5">
                  {t(`promises.${key}Desc`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
