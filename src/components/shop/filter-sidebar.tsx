'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { cn, getLocalizedField } from '@/lib/utils';
import { getCategories, getBrands } from '@/lib/supabase/queries';
import type { Category, Brand } from '@/types';

export interface Filters {
  categoryId: number | null;
  brandId: number | null;
  priceMin: number | null;
  priceMax: number | null;
  material: string | null;
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <span className="font-medium text-dark text-sm uppercase tracking-wide">{title}</span>
        <ChevronDown
          size={16}
          className={cn('text-gray-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterSidebar({ isOpen, onClose, filters, onFiltersChange }: FilterSidebarProps) {
  const t = useTranslations('shop');
  const locale = useLocale();
  const [categories, setCategories] = useState<(Category & { product_count?: number })[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [priceMin, setPriceMin] = useState(filters.priceMin?.toString() || '');
  const [priceMax, setPriceMax] = useState(filters.priceMax?.toString() || '');

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getBrands().then(setBrands).catch(console.error);
  }, []);

  const updateFilter = (update: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...update });
  };

  const applyPrice = () => {
    updateFilter({
      priceMin: priceMin ? Number(priceMin) : null,
      priceMax: priceMax ? Number(priceMax) : null,
    });
  };

  const clearAll = () => {
    setPriceMin('');
    setPriceMax('');
    onFiltersChange({
      categoryId: null,
      brandId: null,
      priceMin: null,
      priceMax: null,
      material: null,
    });
  };

  const hasActiveFilters = filters.categoryId || filters.brandId || filters.priceMin || filters.priceMax || filters.material;

  const materials = ['Acier inoxydable', 'Plaqué or'];

  const content = (
    <div className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-semibold text-dark flex items-center gap-2">
          <SlidersHorizontal size={18} />
          {t('filters')}
        </h3>
        {hasActiveFilters && (
          <button onClick={clearAll} className="text-xs text-gold hover:underline">
            {t('clearFilters')}
          </button>
        )}
      </div>

      {/* Categories */}
      <FilterSection title={t('category')}>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateFilter({ categoryId: filters.categoryId === cat.id ? null : cat.id })}
              className={cn(
                'flex items-center justify-between w-full px-2 py-1.5 text-sm rounded transition-colors text-left',
                filters.categoryId === cat.id
                  ? 'bg-gold/10 text-gold font-medium'
                  : 'text-charcoal hover:bg-cream'
              )}
            >
              <span>{getLocalizedField(cat, 'name', locale)}</span>
              {cat.product_count != null && (
                <span className="text-xs text-gray-400">({cat.product_count})</span>
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title={t('priceRange')}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="w-full px-3 py-2 border border-gray-200 text-sm focus:border-gold focus:outline-none"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            className="w-full px-3 py-2 border border-gray-200 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3" onClick={applyPrice}>
          Appliquer
        </Button>
      </FilterSection>

      {/* Brands */}
      <FilterSection title={t('brand')} defaultOpen={false}>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => updateFilter({ brandId: filters.brandId === brand.id ? null : brand.id })}
              className={cn(
                'flex items-center w-full px-2 py-1.5 text-sm rounded transition-colors text-left',
                filters.brandId === brand.id
                  ? 'bg-gold/10 text-gold font-medium'
                  : 'text-charcoal hover:bg-cream'
              )}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Material */}
      <FilterSection title={t('material')} defaultOpen={false}>
        <div className="space-y-1.5">
          {materials.map((mat) => (
            <button
              key={mat}
              onClick={() => updateFilter({ material: filters.material === mat ? null : mat })}
              className={cn(
                'flex items-center w-full px-2 py-1.5 text-sm rounded transition-colors text-left',
                filters.material === mat
                  ? 'bg-gold/10 text-gold font-medium'
                  : 'text-charcoal hover:bg-cream'
              )}
            >
              {mat}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {content}
        </div>
      </aside>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
