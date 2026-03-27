'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  Search,
  User,
  ShoppingCart,
  Menu,
  X,
  Loader2,
} from 'lucide-react';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { useHydrated } from '@/hooks/use-hydrated';
import { cn, getLocalizedField } from '@/lib/utils';
import { formatPrice } from '@/lib/constants';
import { getProducts } from '@/lib/supabase/queries';
import { LanguageSwitcher } from '../shared/language-switcher';
import { MobileMenu } from './mobile-menu';
import Image from 'next/image';
import type { Product } from '@/types';

const navLinks = [
  { href: '/', key: 'home' },
  { href: '/boutique', key: 'shop' },
  { href: '/a-propos', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/blog', key: 'blog' },
] as const;

export function Header() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mounted = useHydrated();
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const cartTotal = useCartStore((s) => s.getSubtotal());
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await getProducts({ search: query, limit: 5 });
        setSearchResults(results);
      } catch { setSearchResults([]); }
      setIsSearching(false);
    }, 300);
  }, []);

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/boutique?search=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 transition-all duration-300 bg-cream',
          isScrolled && 'shadow-sm'
        )}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[70px]">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 hover:opacity-70 transition-opacity"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Menu"
            >
              <Menu size={22} className="text-dark" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="font-heading text-2xl font-bold text-dark tracking-tight">
                Nano Bijoux
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="text-dark hover:text-gold font-medium text-[15px] transition-colors"
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-1.5 hover:opacity-70 transition-opacity"
                aria-label={tCommon('search')}
              >
                <Search size={20} className="text-dark" />
              </button>

              {/* Language Switcher */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* Account */}
              <Link href={user ? '/mon-compte' : '/connexion'} className="p-1.5 hover:opacity-70 transition-opacity hidden sm:flex items-center gap-1.5">
                {user ? (
                  <div className="w-7 h-7 bg-gold text-white text-xs font-bold flex items-center justify-center">
                    {(profile?.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                ) : (
                  <User size={20} className="text-dark" />
                )}
              </Link>

              {/* Cart with total */}
              <Link href="/panier" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <div className="relative">
                  <ShoppingCart size={20} className="text-dark" />
                  {mounted && cartItemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-gold text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-dark">
                  {mounted ? formatPrice(cartTotal) : '0 DA'}
                </span>
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pb-4">
                  <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-body rtl:left-auto rtl:right-3" />
                    <input
                      type="text"
                      placeholder={tCommon('search')}
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 border border-border bg-white text-sm focus:border-gold focus:outline-none rtl:pl-4 rtl:pr-10"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={closeSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-body hover:text-dark rtl:right-auto rtl:left-3"
                    >
                      {isSearching ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                    </button>
                  </form>

                  {/* Search results dropdown */}
                  {searchQuery.length >= 2 && (
                    <div className="max-w-xl mx-auto mt-1 bg-white border border-border shadow-lg">
                      {searchResults.length === 0 && !isSearching ? (
                        <p className="p-4 text-sm text-text-body text-center">Aucun résultat</p>
                      ) : (
                        <>
                          {searchResults.map((product) => (
                            <Link
                              key={product.id}
                              href={`/produit/${product.slug}`}
                              onClick={closeSearch}
                              className="flex items-center gap-3 p-3 hover:bg-cream transition-colors"
                            >
                              <div className="w-12 h-12 bg-cream overflow-hidden flex-shrink-0 relative">
                                <Image
                                  src={product.images?.[0]?.url || '/images/placeholder.jpg'}
                                  alt={getLocalizedField(product, 'name', locale)}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-dark truncate">
                                  {getLocalizedField(product, 'name', locale)}
                                </p>
                                <p className="text-sm text-gold font-semibold">{formatPrice(product.price)}</p>
                              </div>
                            </Link>
                          ))}
                          {searchResults.length > 0 && (
                            <button
                              onClick={() => { router.push(`/boutique?search=${encodeURIComponent(searchQuery)}`); closeSearch(); }}
                              className="w-full p-3 text-sm text-gold font-medium hover:bg-cream transition-colors border-t border-border"
                            >
                              Voir tous les résultats
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
