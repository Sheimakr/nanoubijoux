'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cart-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { formatPrice } from '@/lib/constants';
import { getLocalizedField, cn } from '@/lib/utils';
import { getProductBySlug } from '@/lib/supabase/queries';
import {
  Heart, ShoppingBag, Minus, Plus, Truck, Shield,
  RotateCcw, ChevronRight, Star, MessageCircle, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { useParams } from 'next/navigation';

export default function ProductPage() {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => product ? s.isInWishlist(product.id) : false);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const data = await getProductBySlug(slug);
      setProduct(data);
      setLoading(false);
    }
    fetch();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[1200px] mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square skeleton" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 skeleton" />
              <div className="h-6 w-1/2 skeleton" />
              <div className="h-10 w-1/3 skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-text-body">Product not found</p>
      </div>
    );
  }

  const name = getLocalizedField(product, 'name', locale);
  const description = getLocalizedField(product, 'description', locale);
  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, null, quantity);
    toast.success(tCommon('addToCart'));
  };

  /**
   * Buy Now — skip the cart review step entirely:
   *   1. Add this product (with the selected quantity) to the cart
   *   2. Route straight to /commande (checkout)
   * `useRouter` comes from @/i18n/navigation so the locale prefix
   * (/fr, /ar, /en) is preserved automatically.
   */
  const handleBuyNow = () => {
    if (!product || product.stock_quantity === 0) return;
    addToCart(product, null, quantity);
    router.push('/commande');
  };

  const primaryImage = product.images?.[selectedImage]?.url || '/images/placeholder.jpg';

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-cream border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-text-body">
            <Link href="/" className="hover:text-gold transition-colors">{tCommon('siteName')}</Link>
            <ChevronRight size={14} />
            <Link href="/boutique" className="hover:text-gold transition-colors">{t('description')}</Link>
            <ChevronRight size={14} />
            <span className="text-dark font-medium truncate">{name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square overflow-hidden bg-cream mb-4">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${primaryImage})` }}
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.is_new && <Badge variant="new">{tCommon('new')}</Badge>}
                {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
              </div>
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'w-20 h-20 overflow-hidden border-2 transition-all',
                      selectedImage === index ? 'border-gold' : 'border-transparent hover:border-border'
                    )}
                  >
                    <div className="w-full h-full bg-cover bg-center bg-cream" style={{ backgroundImage: `url(${image.url})` }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.category && (
              <Link href={`/boutique?category=${product.category.slug}`} className="text-xs text-gold font-medium uppercase tracking-wide hover:underline">
                {getLocalizedField(product.category, 'name', locale)}
              </Link>
            )}

            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-dark mt-2 mb-4">{name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-dark">{formatPrice(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-lg text-text-body line-through">{formatPrice(product.compare_at_price)}</span>
              )}
              {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
            </div>

            {/* SKU & Material */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-body mb-6">
              <span>{t('sku')}: {product.sku}</span>
              {product.material && <span>{t('material')}: {product.material}</span>}
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-dark mb-2">{tCommon('quantity')}</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-cream transition-colors">
                    <Minus size={16} />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center text-sm font-medium border-x border-border">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-cream transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                {product.stock_quantity > 0 && <span className="text-sm text-gold">{tCommon('inStock')}</span>}
              </div>
            </div>

            {/* Actions — Buy Now is the primary CTA (solid gold), Add to
                Cart is demoted to outline as the secondary. Wishlist is
                an icon-only square on the side. */}
            <div className="flex flex-col gap-3 mb-6">
              <Button
                size="lg"
                fullWidth
                onClick={handleBuyNow}
                disabled={product.stock_quantity === 0}
              >
                <Zap size={18} />
                {tCommon('buyNow')}
              </Button>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingBag size={18} />
                  {tCommon('addToCart')}
                </Button>
                <button
                  onClick={() => {
                    toggleWishlist(product);
                    if (!isInWishlist) toast.success('Added to wishlist!');
                  }}
                  className={cn(
                    'w-12 h-12 flex-shrink-0 border-2 flex items-center justify-center transition-all',
                    isInWishlist
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-border text-text-body hover:border-red-300 hover:text-red-400',
                  )}
                  aria-label="Wishlist"
                >
                  <Heart size={20} className={isInWishlist ? 'fill-current' : ''} />
                </button>
              </div>
            </div>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/213549631236?text=${encodeURIComponent(`Bonjour! Je suis intéressé(e) par: ${name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-green-500 text-green-600 font-medium hover:bg-green-50 transition-colors mb-8"
            >
              <MessageCircle size={18} />
              {t('askWhatsapp')}
            </a>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, text: 'Livraison 58 wilayas' },
                { icon: Shield, text: 'Qualité garantie' },
                { icon: RotateCcw, text: 'Acier inoxydable' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="text-center p-3 bg-cream">
                  <Icon size={20} className="mx-auto text-gold mb-1" />
                  <p className="text-xs text-text-body">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex border-b border-border">
            {(['description', 'reviews', 'shippingInfo'] as const).map((tab) => {
              const tabKey = tab === 'shippingInfo' ? 'shipping' : tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tabKey as any)}
                  className={cn(
                    'px-6 py-3 text-sm font-medium transition-colors relative',
                    tabKey === activeTab ? 'text-gold' : 'text-text-body hover:text-dark'
                  )}
                >
                  {t(tab)}
                  {tabKey === activeTab && (
                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none text-dark-light whitespace-pre-line">{description}</div>
            )}
            {activeTab === 'reviews' && (
              <div className="text-center py-12 text-text-body">
                <Star size={40} className="mx-auto text-border mb-3" />
                <p>{t('writeReview')}</p>
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="prose prose-sm max-w-none text-dark-light">
                <p>Livraison disponible dans les 58 wilayas d&apos;Algérie.</p>
                <p>Délai de livraison: 1-2 jours ouvrables.</p>
                <p>Les frais de livraison varient selon la wilaya.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
