'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/section-heading';
import { Instagram } from 'lucide-react';
import { SOCIAL_LINKS } from '@/lib/constants';

const instagramPosts = [
  '/images/insta-1.jpg',
  '/images/insta-2.jpg',
  '/images/insta-3.jpg',
  '/images/insta-4.jpg',
  '/images/insta-5.jpg',
  '/images/insta-6.jpg',
  '/images/insta-7.jpg',
  '/images/insta-8.jpg',
];

export function InstagramFeed() {
  const t = useTranslations('home');

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading title={t('instagram')} subtitle="@nano31bijoux" />

        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {instagramPosts.map((src, index) => (
            <motion.a
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden bg-cream"
            >
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${src})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-cream" />
              <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/40 transition-colors flex items-center justify-center">
                <Instagram
                  size={20}
                  className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
