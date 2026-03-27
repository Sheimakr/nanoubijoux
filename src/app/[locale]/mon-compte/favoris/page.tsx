'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useCartStore } from '@/stores/cart-store';
import { formatPrice } from '@/lib/constants';
import { getLocalizedField } from '@/lib/utils';
import { Heart, ChevronLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Image from 'next/image';

export default function WishlistPage() {
  const t = useTranslations('account');
  const locale = useLocale();
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const { items, removeItem } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (initialized && !user) router.push('/connexion');
  }, [initialized, user, router]);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success('Ajouté au panier');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link href="/mon-compte" className="inline-flex items-center gap-1 text-sm text-text-body hover:text-gold mb-6">
          <ChevronLeft size={16} className="rtl:rotate-180" /> {t('dashboard')}
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-2xl font-bold text-dark mb-6"
        >
          {t('wishlist')}
        </motion.h1>

        {items.length === 0 ? (
          <div className="bg-white border border-border p-12 text-center">
            <Heart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-text-body mb-4">Votre liste de favoris est vide</p>
            <Link href="/boutique" className="text-gold font-medium hover:underline">
              Découvrir nos produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-border overflow-hidden group"
              >
                <Link href={`/produit/${product.slug}`} className="block relative aspect-square bg-cream">
                  <Image
                    src={product.images?.[0]?.url || '/images/placeholder.jpg'}
                    alt={getLocalizedField(product, 'name', locale)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </Link>
                <div className="p-4">
                  <Link href={`/produit/${product.slug}`}>
                    <h3 className="font-medium text-dark text-sm line-clamp-2 mb-1 hover:text-gold transition-colors">
                      {getLocalizedField(product, 'name', locale)}
                    </h3>
                  </Link>
                  <p className="font-semibold text-gold mb-3">{formatPrice(product.price)}</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handleAddToCart(product)}>
                      <ShoppingBag size={14} /> Ajouter
                    </Button>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-2 border border-border text-text-body hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
