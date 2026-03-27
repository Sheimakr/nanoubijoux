'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Package, MapPin, CreditCard, FileText } from 'lucide-react';
import { getErrorMessage } from '@/lib/error-utils';
import Link from 'next/link';
import { getOrderById, updateOrderStatus } from '@/lib/supabase/admin-queries';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/constants';
import { toast } from 'sonner';
import type { Order } from '@/types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const paymentLabels: Record<string, string> = {
  cod: 'Paiement à la livraison',
  baridimob: 'BaridiMob',
  ccp: 'CCP',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payé',
  failed: 'Échoué',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    getOrderById(id)
      .then((data) => {
        setOrder(data as Order);
        setStatus(data.status);
        setTrackingNumber(data.tracking_number || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error('[OrderDetail]', getErrorMessage(err));
        toast.error(`Erreur: ${getErrorMessage(err)}`);
        router.push('/admin/commandes');
      });
  }, [id, router]);

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      const updated = await updateOrderStatus(id, status, trackingNumber || undefined);
      setOrder({ ...order!, ...updated });
      toast.success('Statut mis à jour !');
    } catch (err) {
      console.error('[OrderDetail update]', getErrorMessage(err));
      toast.error(`Erreur: ${getErrorMessage(err)}`);
    }
    setSaving(false);
  };

  if (loading || !order) {
    return (
      <div className="max-w-5xl">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // Flat fields from DB (not a nested shipping_address object)
  const orderData = order as any;

  return (
    <div className="max-w-5xl">
      <Link href="/admin/commandes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gold mb-6">
        <ArrowLeft size={16} /> Retour aux commandes
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-dark">Commande #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(order.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
          {statusLabels[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — order items + notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
              <Package size={18} className="text-gold" />
              <h2 className="font-heading font-semibold text-dark">Articles ({order.items?.length || 0})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  <div className="w-16 h-16 rounded-lg bg-cream overflow-hidden flex-shrink-0">
                    {(item.product_image || item.product_snapshot?.image) ? (
                      <img src={item.product_image || item.product_snapshot?.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">
                      {item.product_name || item.product_snapshot?.name || `Produit #${item.product_id}`}
                    </p>
                    {(item.product_sku || item.product_snapshot?.sku) && (
                      <p className="text-xs text-gray-400">SKU: {item.product_sku || item.product_snapshot?.sku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-dark">{formatPrice(item.unit_price)} x {item.quantity}</p>
                    <p className="text-sm font-semibold text-dark">{formatPrice(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-gold" />
                <h2 className="font-heading font-semibold text-dark">Notes du client</h2>
              </div>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right column — status, address, summary */}
        <div className="space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <h2 className="font-heading font-semibold text-dark">Mettre à jour</h2>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Statut</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:border-gold focus:outline-none"
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">N° de suivi</label>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="EX: 123456789"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <Button onClick={handleUpdateStatus} disabled={saving} className="w-full">
              <Save size={16} /> {saving ? 'Enregistrement...' : 'Mettre à jour'}
            </Button>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={18} className="text-gold" />
              <h2 className="font-heading font-semibold text-dark">Adresse de livraison</h2>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-dark">{orderData.full_name}</p>
              <p>{orderData.phone}</p>
              {orderData.address_line && <p>{orderData.address_line}</p>}
              <p>
                {orderData.commune && `${orderData.commune}, `}
                Wilaya {orderData.wilaya_id}
              </p>
              {orderData.delivery_type && (
                <p className="text-xs text-gray-400 mt-1">
                  Type: {orderData.delivery_type === 'desk' ? 'Stop desk' : 'À domicile'}
                </p>
              )}
              {orderData.ecotrack_tracking && (
                <p className="text-xs text-blue-600 mt-1">
                  Suivi EcoTrack: {orderData.ecotrack_tracking}
                </p>
              )}
            </div>
          </div>

          {/* Payment & Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={18} className="text-gold" />
              <h2 className="font-heading font-semibold text-dark">Résumé</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Remise</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Livraison</span>
                <span>{formatPrice(order.shipping_fee)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-dark">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Paiement</span>
                  <span>{paymentLabels[order.payment_method] || order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut paiement</span>
                  <span className={order.payment_status === 'paid' ? 'text-green-600 font-medium' : ''}>
                    {paymentStatusLabels[order.payment_status] || order.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
