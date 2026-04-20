'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useHydrated } from '@/hooks/use-hydrated';
import { formatPrice } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getWilayas, createOrder, validateCoupon, incrementCouponUsage } from '@/lib/supabase/queries';
import { Check, Truck, Package, ChevronRight, Tag, Home, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { getLocalizedField } from '@/lib/utils';

const steps = ['step1', 'step2', 'step4'] as const; // Info, Shipping, Confirmation (COD only)

interface WilayaData {
  id: number;
  name_fr: string;
  name_ar?: string;
  name_en?: string;
  shipping_fee: number;
  delivery_days?: number;
  home_fee?: number;
  desk_fee?: number;
  free_from?: number;
}

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { items, getSubtotal, getDiscount, clearCart } = useCartStore();
  // Pull the logged-in user from the auth store so we can pin orders
  // to the correct account. If null → guest checkout (user_id stays null).
  const { user: authUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [wilayas, setWilayas] = useState<WilayaData[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<WilayaData | null>(null);
  const [deliveryType, setDeliveryType] = useState<'home' | 'desk'>('home');
  const [formData, setFormData] = useState({ fullName: '', phone: '', commune: '', address: '', notes: '' });
  const [orderNumber, setOrderNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponId, setCouponId] = useState<string | null>(null);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getWilayas().then(setWilayas).catch(console.error);
  }, []);

  // Load communes when wilaya changes
  useEffect(() => {
    if (!selectedWilaya) {
      setCommunes([]);
      return;
    }
    fetch(`/api/communes?wilaya_code=${selectedWilaya.id}`)
      .then(r => r.json())
      .then((data: string[]) => {
        setCommunes(Array.isArray(data) ? data : []);
        setFormData(prev => ({ ...prev, commune: '' }));
      })
      .catch(() => setCommunes([]));
  }, [selectedWilaya]);

  // Calculate delivery fee based on type
  // Pure function: takes the subtotal as an argument instead of reading
  // a closed-over `subtotal` const. Avoids the TDZ trap — the previous
  // version threw `Cannot access 'subtotal' before initialization` once
  // a wilaya was selected, because subtotal is declared BELOW the first
  // call to this function during render.
  const getDeliveryFee = (sub: number) => {
    if (!selectedWilaya) return 0;
    const homeFee = selectedWilaya.home_fee ?? selectedWilaya.shipping_fee ?? 0;
    const deskFee = selectedWilaya.desk_fee ?? 0;
    const fee = deliveryType === 'desk' && deskFee > 0 ? deskFee : homeFee;

    // Free delivery threshold — applies only when cart is above the
    // wilaya-specific `free_from` value.
    if (selectedWilaya.free_from && selectedWilaya.free_from > 0 && sub >= selectedWilaya.free_from) {
      return 0;
    }
    return fee;
  };

  const hasDeskDelivery = selectedWilaya && (selectedWilaya.desk_fee ?? 0) > 0;

  // Cart values derive from Zustand + localStorage which isn't readable on
  // the server. We must render the SAME thing on SSR and initial client
  // paint (otherwise React throws a hydration mismatch error). `hydrated`
  // flips true only after the first effect runs on the client, at which
  // point the real cart values replace the SSR-safe zeros.
  const hydrated = useHydrated();
  const rawSubtotal = getSubtotal();
  const rawDiscount = getDiscount() + couponDiscount;
  const shippingFee = getDeliveryFee(rawSubtotal);

  const subtotal = hydrated ? rawSubtotal : 0;
  const discount = hydrated ? rawDiscount : 0;
  const total    = hydrated
    ? Math.max(0, rawSubtotal - rawDiscount + shippingFee)
    : 0;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { coupon, discountAmount } = await validateCoupon(couponCode, subtotal);
      setCouponDiscount(discountAmount);
      setCouponId(coupon.id);
      setCouponApplied(true);
      toast.success(`Code promo appliqué ! -${formatPrice(discountAmount)}`);
    } catch (err: any) {
      toast.error(err.message || 'Code promo invalide');
      setCouponDiscount(0);
      setCouponId(null);
      setCouponApplied(false);
    }
    setCouponLoading(false);
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponId(null);
    setCouponApplied(false);
  };

  const nextStep = () => {
    if (currentStep === 0) {
      if (!formData.fullName.trim()) { toast.error('Veuillez entrer votre nom'); return; }
      if (!formData.phone.trim() || !/^0[567]\d{8}$/.test(formData.phone.trim())) {
        toast.error('Numéro de téléphone invalide (ex: 0555123456)');
        return;
      }
    }
    if (currentStep === 1) {
      if (!selectedWilaya) { toast.error('Veuillez sélectionner une wilaya'); return; }
      if (!formData.commune) { toast.error('Veuillez sélectionner une commune'); return; }
      if (deliveryType === 'home' && !formData.address.trim()) { toast.error('Veuillez entrer votre adresse'); return; }
      // Place order directly (COD only, no payment step)
      placeOrder();
      return;
    }
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const placeOrder = async () => {
    if (items.length === 0) { toast.error('Votre panier est vide'); return; }

    setSubmitting(true);
    try {
      const order = await createOrder({
        full_name: formData.fullName,
        phone: formData.phone,
        wilaya_id: selectedWilaya!.id,
        commune: formData.commune,
        address_line: formData.address,
        notes: formData.notes || undefined,
        payment_method: 'cod',
        delivery_type: deliveryType,
        subtotal,
        discount,
        shipping_fee: shippingFee,
        total,
        // Explicit user_id from the auth store — more reliable than
        // supabase.auth.getUser() which was returning null even for
        // logged-in users (session-cookie sync issue).
        user_id: authUser?.id ?? null,
        items: items.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant?.id || null,
          quantity: item.quantity,
          unit_price: item.variant?.price_override ?? item.product.price,
          total_price: (item.variant?.price_override ?? item.product.price) * item.quantity,
          product_name: item.product.name_fr,
          product_image: item.product.images?.[0]?.url,
          product_sku: item.product.sku,
        })),
      });
      if (couponId) {
        await incrementCouponUsage(couponId).catch(console.error);
      }
      setOrderNumber(order.id.slice(0, 8).toUpperCase());
      clearCart();
      toast.success('Commande confirmée !');
      setCurrentStep(2); // Confirmation step
    } catch (err: unknown) {
      // Maximum-diagnostic dump: previous attempts showed empty "{}"
      // because Error-like objects have non-enumerable message/stack.
      // Use getOwnPropertyNames + JSON.stringify to force those out.
      const e = err as {
        message?: string;
        code?: string;
        details?: string;
        hint?: string;
        name?: string;
        stack?: string;
      };
      const ownProps =
        err && typeof err === 'object'
          ? Object.getOwnPropertyNames(err as object)
          : [];
      const serialized = JSON.stringify(err, ownProps);

      console.error('[order] typeof:',       typeof err);
      console.error('[order] constructor:',  (err as object)?.constructor?.name);
      console.error('[order] own props:',    ownProps);
      console.error('[order] serialized:',   serialized);
      console.error('[order] message:',      e?.message);
      console.error('[order] code:',         e?.code);
      console.error('[order] details:',      e?.details);
      console.error('[order] hint:',         e?.hint);
      console.error('[order] stack:',        e?.stack);
      console.error('[order] raw ref:',      err);

      // Special case: FK violation on order_items.product_id means the
      // cart contains product IDs that no longer exist in the products
      // table (usually stale localStorage after a DB reset). Offer the
      // user a one-click cart reset instead of a cryptic error.
      if (
        e?.code === '23503' &&
        e?.message?.includes('order_items_product_id_fkey')
      ) {
        toast.error(
          'Votre panier contient des produits qui n\'existent plus. Vidage automatique…',
          { duration: 5000 },
        );
        clearCart();
        // Bump them back to step 0 so they restart fresh.
        setCurrentStep(0);
        return;
      }

      // Generic path: prefer message → details → code → fallback.
      const userMsg =
        e?.message ||
        e?.details ||
        e?.hint ||
        e?.code ||
        (serialized && serialized !== '{}' ? serialized : 'Erreur lors de la commande. Réessayez.');
      toast.error(userMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Informations', 'Livraison', 'Confirmation'];

  return (
    <div className="min-h-screen bg-gray-light">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-3xl font-bold text-dark mb-8"
        >
          Passer la commande
        </motion.h1>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-10 max-w-md mx-auto">
          {stepLabels.map((label, index) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    backgroundColor: index <= currentStep ? '#C5912C' : '#E5E7EB',
                    color: index <= currentStep ? '#FFF' : '#9CA3AF',
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                >
                  {index < currentStep ? <Check size={18} /> : index + 1}
                </motion.div>
                <span className="text-xs mt-1.5 text-gray-500 hidden sm:block">{label}</span>
              </div>
              {index < stepLabels.length - 1 && (
                <motion.div
                  animate={{ backgroundColor: index < currentStep ? '#C5912C' : '#E5E7EB' }}
                  className="w-12 sm:w-20 h-0.5 mx-2"
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form area */}
          <div className="lg:col-span-2">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm"
            >
              {/* Step 1: Information */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  <h2 className="font-heading text-xl font-semibold text-dark mb-4">Vos informations</h2>
                  <Input id="fullName" label="Nom complet *" placeholder="Ahmed Benaissa" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                  <Input id="phone" label="Numéro de téléphone *" type="tel" placeholder="0555123456" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  <p className="text-xs text-gray-400">Format: 05XX, 06XX ou 07XX suivi de 8 chiffres</p>
                  <div className="flex justify-end">
                    <Button onClick={nextStep}>
                      Suivant <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Shipping */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <h2 className="font-heading text-xl font-semibold text-dark mb-4">Livraison</h2>

                  {/* Wilaya */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1.5">Wilaya *</label>
                    <select
                      value={selectedWilaya?.id ?? ''}
                      onChange={(e) => {
                        const w = wilayas.find(w => w.id === Number(e.target.value));
                        setSelectedWilaya(w || null);
                        if (w && (!w.desk_fee || w.desk_fee === 0)) setDeliveryType('home');
                      }}
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
                      required
                    >
                      <option value="">Sélectionner une wilaya...</option>
                      {wilayas.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.id} - {w.name_fr} ({formatPrice(w.home_fee ?? w.shipping_fee)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Commune */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1.5">Commune *</label>
                    <select
                      value={formData.commune}
                      onChange={(e) => setFormData({...formData, commune: e.target.value})}
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:border-gold focus:outline-none"
                      required
                      disabled={communes.length === 0}
                    >
                      <option value="">{communes.length === 0 ? 'Sélectionner d\'abord une wilaya' : 'Sélectionner une commune...'}</option>
                      {communes.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Delivery Type */}
                  {selectedWilaya && (
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Type de livraison</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('home')}
                          className={cn(
                            'p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all',
                            deliveryType === 'home' ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <Home size={20} className={deliveryType === 'home' ? 'text-gold' : 'text-gray-400'} />
                          <div>
                            <span className="font-medium text-dark text-sm">À domicile</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatPrice(selectedWilaya.home_fee ?? selectedWilaya.shipping_fee)}
                            </p>
                          </div>
                        </button>
                        {hasDeskDelivery && (
                          <button
                            type="button"
                            onClick={() => setDeliveryType('desk')}
                            className={cn(
                              'p-4 rounded-xl border-2 text-left flex items-start gap-3 transition-all',
                              deliveryType === 'desk' ? 'border-gold bg-gold/5' : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <Building2 size={20} className={deliveryType === 'desk' ? 'text-gold' : 'text-gray-400'} />
                            <div>
                              <span className="font-medium text-dark text-sm">Stop desk</span>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatPrice(selectedWilaya.desk_fee!)}
                              </p>
                            </div>
                          </button>
                        )}
                      </div>
                      {selectedWilaya.free_from && selectedWilaya.free_from > 0 && (
                        <p className="text-xs text-green-600 mt-2">
                          Livraison gratuite à partir de {formatPrice(selectedWilaya.free_from)}
                          {subtotal >= selectedWilaya.free_from && ' ✓ Applicable !'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Address (only for home delivery) */}
                  {deliveryType === 'home' && (
                    <Input id="address" label="Adresse *" placeholder="Rue, quartier, numéro..." required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  )}

                  <textarea
                    placeholder="Notes (optionnel)"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none resize-none"
                  />

                  {/* Payment info */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
                    <Package size={20} className="text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Paiement à la livraison</p>
                      <p className="text-xs text-amber-600">Vous payez en espèces au livreur</p>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button variant="ghost" onClick={prevStep}>Précédent</Button>
                    <Button onClick={nextStep} disabled={submitting}>
                      {submitting ? 'Traitement...' : 'Confirmer la commande'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {currentStep === 2 && (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 mx-auto mb-6 bg-teal/10 rounded-full flex items-center justify-center"
                  >
                    <Check size={40} className="text-teal" />
                  </motion.div>
                  <h2 className="font-heading text-2xl font-bold text-dark mb-2">
                    Merci pour votre commande !
                  </h2>
                  <p className="text-gray-500 mb-2">Commande: <strong>#NB-{orderNumber}</strong></p>
                  <p className="text-gray-500">Livraison estimée: 1-3 jours</p>
                  <p className="text-sm text-gray-400 mt-4">Vous serez contacté par téléphone pour confirmer.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Order Summary sidebar */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-24">
              <h3 className="font-heading text-lg font-semibold text-dark mb-4">Récapitulatif</h3>
              {/* Same hydration guard as subtotal/total — render empty list
                  on server + first client paint, then the real items. */}
              <div className="space-y-3 mb-4">
                {hydrated && items.map((item) => {
                  // Display in the user's locale; fall back to FR via helper.
                  const productName = getLocalizedField(item.product, 'name', locale) || 'Produit';
                  return (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg bg-cream overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={item.product.images?.[0]?.url || '/images/placeholder.jpg'}
                          alt={productName}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-dark truncate">{productName}</p>
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPrice((item.variant?.price_override ?? item.product.price) * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Coupon */}
              <div className="border-t border-gray-100 pt-3 mb-3">
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Tag size={14} />
                      <span className="font-medium">{couponCode.toUpperCase()}</span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                    <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline">Retirer</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                        placeholder="Code promo"
                        className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:border-gold focus:outline-none"
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={applyCoupon} disabled={couponLoading}>
                      {couponLoading ? '...' : 'OK'}
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-teal">
                    <span>Réduction</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Livraison {deliveryType === 'desk' ? '(stop desk)' : ''}</span>
                  <span className={shippingFee === 0 && selectedWilaya ? 'text-green-600 font-medium' : ''}>
                    {!selectedWilaya ? '—' : shippingFee === 0 ? 'Gratuite' : formatPrice(shippingFee)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span className="text-dark">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
