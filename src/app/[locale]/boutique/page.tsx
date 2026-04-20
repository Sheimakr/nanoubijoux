'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/shop/product-card';
import { FilterSidebar, type Filters } from '@/components/shop/filter-sidebar';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Grid3X3, LayoutGrid, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProducts } from '@/lib/supabase/queries';
import type { Product } from '@/types';

const emptyFilters: Filters = {
  categoryId: null,
  brandId: null,
  priceMin: null,
  priceMax: null,
  materialId: null,
};

export default function BoutiquePage() {
  const t = useTranslations('shop');
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(3);
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const data = await getProducts({
          sort: sortBy,
          limit: 40,
          search: searchQuery || undefined,
          categoryId: filters.categoryId || undefined,
          brandId: filters.brandId || undefined,
          priceMin: filters.priceMin || undefined,
          priceMax: filters.priceMax || undefined,
          materialId: filters.materialId || undefined,
        });
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
      setLoading(false);
    }
    fetchProducts();
  }, [sortBy, searchQuery, filters]);

  const activeFilterCount = [
    filters.categoryId,
    filters.brandId,
    filters.priceMin || filters.priceMax,
    filters.materialId,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Page header */}
      <div className="bg-cream border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl font-bold text-dark"
          >
            {t('title')}
          </motion.h1>
          {searchQuery ? (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-text-body">
                Résultats pour &quot;{searchQuery}&quot; ({products.length})
              </p>
              <a href="?" className="text-gold hover:underline text-sm flex items-center gap-1">
                <X size={14} /> Effacer
              </a>
            </div>
          ) : (
            <p className="text-text-body mt-2">
              {t('showing', { count: products.length })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filter sidebar */}
          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Main content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 bg-white p-3 border border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden"
              >
                <SlidersHorizontal size={16} />
                {t('filters')}
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-gold text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-text-body hidden sm:inline">{t('sort')}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-border px-3 py-1.5 focus:border-gold focus:outline-none bg-white"
                >
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="price_asc">{t('sortPriceAsc')}</option>
                  <option value="price_desc">{t('sortPriceDesc')}</option>
                </select>
              </div>

              <div className="hidden lg:flex items-center gap-1">
                <button
                  onClick={() => setGridCols(3)}
                  className={cn('p-1.5 transition-colors', gridCols === 3 ? 'bg-gold text-white' : 'text-text-body hover:text-dark')}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={cn('p-1.5 transition-colors', gridCols === 4 ? 'bg-gold text-white' : 'text-text-body hover:text-dark')}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>

            {/* Active filters bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {filters.categoryId && (
                  <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-xs px-3 py-1.5 font-medium">
                    Catégorie
                    <button onClick={() => setFilters({ ...filters, categoryId: null })}><X size={12} /></button>
                  </span>
                )}
                {filters.brandId && (
                  <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-xs px-3 py-1.5 font-medium">
                    Marque
                    <button onClick={() => setFilters({ ...filters, brandId: null })}><X size={12} /></button>
                  </span>
                )}
                {(filters.priceMin || filters.priceMax) && (
                  <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-xs px-3 py-1.5 font-medium">
                    {filters.priceMin || 0} - {filters.priceMax || '∞'} DA
                    <button onClick={() => setFilters({ ...filters, priceMin: null, priceMax: null })}><X size={12} /></button>
                  </span>
                )}
                {filters.materialId && (
                  <span className="inline-flex items-center gap-1 bg-gold/10 text-gold text-xs px-3 py-1.5 font-medium">
                    Matière
                    <button onClick={() => setFilters({ ...filters, materialId: null })}><X size={12} /></button>
                  </span>
                )}
                <button
                  onClick={() => setFilters(emptyFilters)}
                  className="text-xs text-text-body hover:text-gold underline"
                >
                  Tout effacer
                </button>
              </div>
            )}

            {/* Product grid */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className={cn(
                'grid gap-4',
                'grid-cols-2',
                gridCols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
              )}>
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-20">
                <p className="text-text-body mb-3">Aucun produit trouvé</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setFilters(emptyFilters)}>
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
