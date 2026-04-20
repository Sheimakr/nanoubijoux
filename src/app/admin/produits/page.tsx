'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  FolderTree,
  Tag,
  Gem,
} from 'lucide-react';
import { getAdminProducts, deleteProduct } from '@/lib/supabase/admin-queries';
import { formatPrice } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRealtimeTable } from '@/hooks/use-realtime-table';

// Standalone page components — imported as regular React components and
// rendered as tab content. Each manages its own data fetching + state.
import AdminCategoriesPage from '../categories/page';
import AdminBrandsPage from '../brands/page';
import AdminMaterialsPage from '../materials/page';

/**
 * Catalog hub — four tabs:
 *   - Produits     (this file's ProductsTable)
 *   - Catégories   (imported from /admin/categories/page)
 *   - Marques      (imported from /admin/brands/page)
 *   - Matières     (imported from /admin/materials/page)
 *
 * The individual route pages (/admin/categories, /admin/brands,
 * /admin/materials) still exist and work by direct URL — they're
 * simply no longer in the sidebar. This lets the hub re-use their
 * components without any extraction.
 */

type TabKey = 'produits' | 'categories' | 'brands' | 'materials';

const TABS: { key: TabKey; label: string; icon: typeof Package }[] = [
  { key: 'produits',   label: 'Produits',    icon: Package    },
  { key: 'categories', label: 'Catégories',  icon: FolderTree },
  { key: 'brands',     label: 'Marques',     icon: Tag        },
  { key: 'materials',  label: 'Matières',    icon: Gem        },
];

export default function AdminCatalogPage() {
  const [tab, setTab] = useState<TabKey>('produits');

  return (
    <div className="space-y-6">
      {/* Tab bar — horizontal scroll on small screens */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
                active
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-500 hover:text-dark',
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'produits'   && <ProductsTab />}
      {tab === 'categories' && <AdminCategoriesPage />}
      {tab === 'brands'     && <AdminBrandsPage />}
      {tab === 'materials'  && <AdminMaterialsPage />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ProductsTab — preserved exactly from the previous /admin/produits
// page. Search, realtime, delete, pagination — all unchanged. Moved
// into an internal component so the hub can switch between tabs.
// ─────────────────────────────────────────────────────────────────────
function ProductsTab() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { products: data, total: count } = await getAdminProducts({
        search: search || undefined,
        limit,
        offset: page * limit,
      });
      setProducts(data);
      setTotal(count);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  // Realtime: product list auto-refreshes on INSERT / UPDATE / DELETE.
  // Toast on INSERT only — keeps the dashboard quiet during bulk edits.
  useRealtimeTable<{ id: number; name_fr?: string }>({
    table: 'products',
    onChange: (payload) => {
      if (payload.eventType === 'INSERT') {
        const name = payload.new?.name_fr ?? `#${payload.new?.id ?? ''}`;
        toast.success(`Nouveau produit : ${name}`);
      }
      fetchProducts();
    },
  });

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      await deleteProduct(id);
      toast.success('Produit supprimé');
      fetchProducts();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Rechercher un produit..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <Link href="/admin/produits/nouveau">
          <Button size="sm">
            <Plus size={16} /> Ajouter un produit
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Produit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Catégorie</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Prix</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Statut</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-dark">{product.name_fr}</p>
                          <p className="text-xs text-gray-400">{product.sku || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {product.category?.name_fr || '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          product.stock_quantity > 10
                            ? 'bg-green-50 text-green-600'
                            : product.stock_quantity > 0
                              ? 'bg-yellow-50 text-yellow-600'
                              : 'bg-red-50 text-red-600',
                        )}
                      >
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {product.is_featured && (
                          <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded">
                            Vedette
                          </span>
                        )}
                        {product.is_new && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                            Nouveau
                          </span>
                        )}
                        {product.is_on_sale && (
                          <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                            Promo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/produits/${product.id}`}
                          className="p-1.5 text-gray-400 hover:text-gold transition-colors"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name_fr)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">{total} produit(s)</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-30"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * limit >= total}
                className="px-3 py-1 text-sm border rounded disabled:opacity-30"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
