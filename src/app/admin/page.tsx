'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, Users, DollarSign, AlertTriangle, ArrowRight } from 'lucide-react';
import { getDashboardStats } from '@/lib/supabase/admin-queries';
import { formatPrice } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  recentOrders: any[];
}

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Produits', value: stats.totalProducts, icon: Package, color: 'text-blue-600 bg-blue-50', href: '/admin/produits' },
    { label: 'Commandes', value: stats.totalOrders, icon: ShoppingCart, color: 'text-green-600 bg-green-50', href: '/admin/commandes' },
    { label: 'Revenus', value: formatPrice(stats.totalRevenue), icon: DollarSign, color: 'text-gold bg-gold/10', href: '/admin/commandes' },
    { label: 'Clients', value: stats.totalCustomers, icon: Users, color: 'text-purple-600 bg-purple-50', href: '/admin/clients' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{card.label}</span>
                <div className={cn('p-2 rounded-lg', card.color)}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="text-2xl font-bold text-dark">{card.value}</div>
            </Link>
          );
        })}
      </div>

      {/* Pending orders alert */}
      {stats.pendingOrders > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-yellow-600" />
          <p className="text-sm text-yellow-700">
            <strong>{stats.pendingOrders} commande(s)</strong> en attente de confirmation
          </p>
          <Link href="/admin/commandes?status=pending" className="ml-auto text-sm text-yellow-700 hover:underline flex items-center gap-1">
            Voir <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-heading font-semibold text-dark">Commandes récentes</h2>
          <Link href="/admin/commandes" className="text-sm text-gold hover:underline flex items-center gap-1">
            Tout voir <ArrowRight size={14} />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-50" />
            <p>Aucune commande pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">ID</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Statut</th>
                  <th className="text-right px-6 py-3 text-gray-500 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">#{order.id}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn('text-xs px-2 py-1 rounded-full font-medium', statusColors[order.status] || 'bg-gray-100')}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-medium">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
