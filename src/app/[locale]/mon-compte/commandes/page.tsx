'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { getUserOrders } from '@/lib/supabase/auth';
import { formatPrice } from '@/lib/constants';
import { ShoppingBag, ChevronLeft, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', label: 'En attente' },
  confirmed: { icon: Package, color: 'text-blue-600 bg-blue-50', label: 'Confirmée' },
  shipped: { icon: Truck, color: 'text-purple-600 bg-purple-50', label: 'Expédiée' },
  delivered: { icon: CheckCircle, color: 'text-green-600 bg-green-50', label: 'Livrée' },
  cancelled: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Annulée' },
};

export default function OrdersPage() {
  const t = useTranslations('account');
  const locale = useLocale();
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialized && !user) {
      router.push('/connexion');
      return;
    }
    if (user) {
      getUserOrders().then((data) => {
        setOrders(data);
        setLoading(false);
      });
    }
  }, [initialized, user, router]);

  if (!initialized || loading) {
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
          {t('orders')}
        </motion.h1>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-border p-12 text-center"
          >
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-text-body mb-4">Aucune commande pour le moment</p>
            <Link href="/boutique" className="text-gold font-medium hover:underline">
              Découvrir nos produits
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border border-border p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm text-text-body">Commande </span>
                      <span className="font-mono font-semibold text-dark">
                        #NB-{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>
                      <StatusIcon size={14} />
                      {status.label}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-body">
                      {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                    <span className="font-semibold text-dark">{formatPrice(order.total)}</span>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50 text-xs text-text-body">
                      {order.items.length} article{order.items.length > 1 ? 's' : ''} •{' '}
                      {order.payment_method === 'cod' ? 'Paiement à la livraison' :
                       order.payment_method === 'baridimob' ? 'BaridiMob' : 'CCP'}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
