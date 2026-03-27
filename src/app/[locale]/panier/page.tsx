'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart-store';
import { formatPrice } from '@/lib/constants';
import { getLocalizedField } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function CartPage() {
  const t = useTranslations('cart');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { items, updateQuantity, removeItem, getSubtotal, getDiscount, getTotal, getItemCount } = useCartStore();
  const [couponCode, setCouponCode] = useState('');

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <ShoppingBag size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="font-heading text-2xl font-bold text-dark mb-2">{t('empty')}</h2>
          <p className="text-gray-500 mb-6">{t('emptyDesc')}</p>
          <Link href="/boutique">
            <Button>{tCommon('continueShopping')}</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-3xl font-bold text-dark mb-8"
        >
          {t('title')} ({getItemCount()})
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item) => {
                const name = getLocalizedField(item.product, 'name', locale);
                const price = item.variant?.price_override ?? item.product.price;
                const image = item.product.images?.[0]?.url || '/images/placeholder.jpg';

                return (
                  <motion.div
                    key={`${item.product.id}-${item.variant?.id || 'default'}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50, height: 0 }}
                    className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm flex gap-4"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-cream flex-shrink-0 relative">
                      <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/produit/${item.product.slug}`}>
                        <h3 className="font-medium text-dark hover:text-gold transition-colors text-sm sm:text-base truncate">
                          {name}
                        </h3>
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.variant.name}</p>
                      )}
                      <p className="text-gold font-bold mt-1">{formatPrice(price)}</p>

                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.variant?.id || null, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 h-8 flex items-center justify-center text-sm font-medium border-x border-gray-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.variant?.id || null, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Subtotal + Remove */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-dark">
                            {formatPrice(price * item.quantity)}
                          </span>
                          <button
                            onClick={() => {
                              removeItem(item.product.id, item.variant?.id || null);
                              toast(t('itemRemoved'), { action: { label: t('undo'), onClick: () => {} } });
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Continue shopping */}
            <Link href="/boutique" className="inline-flex items-center gap-2 text-sm text-gold hover:underline mt-4">
              <ArrowLeft size={16} className="rtl:rotate-180" />
              {tCommon('continueShopping')}
            </Link>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm sticky top-24"
            >
              <h2 className="font-heading text-xl font-bold text-dark mb-6">
                {t('orderSummary')}
              </h2>

              {/* Coupon */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rtl:left-auto rtl:right-3" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder={t('couponCode')}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-gold focus:outline-none rtl:pl-3 rtl:pr-10"
                  />
                </div>
                <Button variant="outline" size="sm">{tCommon('apply')}</Button>
              </div>

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{tCommon('subtotal')}</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-teal">
                    <span>{tCommon('discount')} (10%)</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">{tCommon('shipping')}</span>
                  <span className="text-gray-400">Calculé à la caisse</span>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{tCommon('total')}</span>
                    <span className="text-dark">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <Link href="/commande" className="block mt-6">
                <Button fullWidth size="lg">
                  {tCommon('proceedToCheckout')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
