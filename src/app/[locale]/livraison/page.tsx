'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Truck, Clock, MapPin, Package } from 'lucide-react';

export default function ShippingPage() {
  const t = useTranslations('nav');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-cream border-b border-border py-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl font-bold text-dark"
          >
            {t('shipping')}
          </motion.h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Truck, title: 'Livraison rapide', desc: 'Livraison en 1-2 jours ouvrables dans toute l\'Algérie' },
            { icon: MapPin, title: '58 Wilayas', desc: 'Nous livrons dans toutes les wilayas d\'Algérie' },
            { icon: Clock, title: 'Suivi de commande', desc: 'Suivez votre commande en temps réel' },
            { icon: Package, title: 'Emballage soigné', desc: 'Vos bijoux sont emballés avec soin dans nos écrins signature' },
          ].map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-cream rounded-2xl"
            >
              <Icon size={28} className="text-gold mb-3" />
              <h3 className="font-heading text-lg font-semibold text-dark mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="prose prose-sm max-w-none text-charcoal">
          <h2 className="font-heading">Politique de livraison</h2>
          <p>
            Chez Nano Bijoux, nous nous engageons à vous livrer vos commandes le plus rapidement possible.
            Toutes les commandes sont traitées sous 24 heures et expédiées via nos partenaires de livraison.
          </p>
          <h3 className="font-heading">Frais de livraison</h3>
          <p>
            Les frais de livraison varient selon votre wilaya, généralement entre 400 DA et 800 DA.
            Le montant exact sera calculé automatiquement lors de la commande.
          </p>
          <h3 className="font-heading">Délais de livraison</h3>
          <p>
            La livraison est effectuée sous 1 à 2 jours ouvrables pour les grandes villes
            et 2 à 4 jours pour les zones plus éloignées.
          </p>
        </div>
      </div>
    </div>
  );
}
