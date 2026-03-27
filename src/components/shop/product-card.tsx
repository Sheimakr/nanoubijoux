'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Heart, ShoppingBag, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useHydrated } from '@/hooks/use-hydrated';
import { formatPrice } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const t = useTranslations('shop');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const hydrated = useHydrated();
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));

  const name = product.name_fr || 'Produit';
  const primaryImage = product.images?.[0]?.url || '/images/placeholder.jpg';
  const outOfStock = product.stock_quantity === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product);
    toast.success(t('addedToCart'));
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product);
    router.push('/commande');
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    if (!isInWishlist) {
      toast.success(t('addedToWishlist'));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <div className="group bg-white overflow-hidden rounded-xl border border-gray-100 hover:border-gold/30 hover:shadow-md transition-all duration-300">
        {/* Image */}
        <Link href={`/produit/${product.slug}`}>
          <div className="relative aspect-square overflow-hidden bg-gray-light">
            <Image
              src={primaryImage}
              alt={name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.is_new && <Badge variant="new">{tCommon('new')}</Badge>}
              {product.is_on_sale && product.compare_at_price && (
                <Badge variant="sale">
                  -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                </Badge>
              )}
              {outOfStock && (
                <Badge variant="outOfStock" className="text-xs">Épuisé</Badge>
              )}
            </div>

            {/* Wishlist heart */}
            <button
              onClick={handleToggleWishlist}
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <Heart
                size={14}
                className={cn(
                  hydrated && isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'
                )}
              />
            </button>
          </div>
        </Link>

        {/* Info + Buttons */}
        <div className="p-3">
          {/* Name */}
          <Link href={`/produit/${product.slug}`}>
            <h3 className="font-medium text-dark text-sm leading-snug mb-1 line-clamp-2 hover:text-gold transition-colors">
              {name}
            </h3>
          </Link>

          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-400 mb-2">
              {product.category.name_fr}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold text-dark">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gold text-gold text-xs font-medium rounded-lg hover:bg-gold hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={14} />
              Ajouter
            </button>
            <button
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gold text-white text-xs font-medium rounded-lg hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap size={14} />
              Acheter
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
