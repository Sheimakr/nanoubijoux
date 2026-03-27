'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { SectionHeading } from '@/components/ui/section-heading';
import { Award, Heart, Truck, Shield } from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations('about');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative bg-dark py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-teal/10" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            {t('title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Chaque femme mérite de se sentir unique, élégante et pleine de confiance.
          </motion.p>
        </div>
      </div>

      {/* Story */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t('story')} />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="prose prose-lg max-w-none text-charcoal"
          >
            <p>
              Nano Bijoux est née de la passion de rendre l&apos;élégance accessible à toutes les femmes algériennes.
              Nous croyons que chaque femme mérite de porter des bijoux qui reflètent sa personnalité et sa beauté intérieure.
            </p>
            <p>
              Notre collection de bijoux en acier inoxydable plaqué or offre la beauté de l&apos;or véritable
              avec la durabilité de l&apos;acier. Résistants à l&apos;eau, au ternissement et à l&apos;usure quotidienne,
              nos pièces sont conçues pour accompagner chaque moment de votre vie.
            </p>
            <p>
              Avec la livraison disponible dans les 58 wilayas d&apos;Algérie, nous nous engageons à apporter
              l&apos;élégance directement à votre porte.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title={t('mission')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: 'Passion', desc: 'Chaque bijou est sélectionné avec soin et amour' },
              { icon: Award, title: 'Qualité', desc: 'Acier inoxydable 316L plaqué or 18 carats' },
              { icon: Truck, title: 'Accessibilité', desc: 'Livraison rapide dans les 58 wilayas' },
              { icon: Shield, title: 'Confiance', desc: 'Des milliers de clientes satisfaites' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-8 bg-white rounded-2xl shadow-sm"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center">
                  <Icon size={28} className="text-gold" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-dark mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
