'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { useHydrated } from '@/hooks/use-hydrated';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, MapPin, Heart, Settings, ChevronRight, Package, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const menuItems = [
  { href: '/mon-compte/commandes', icon: ShoppingBag, key: 'orders' },
  { href: '/mon-compte/adresses', icon: MapPin, key: 'addresses' },
  { href: '/mon-compte/favoris', icon: Heart, key: 'wishlist' },
  { href: '/mon-compte/parametres', icon: Settings, key: 'settings' },
] as const;

export default function AccountPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const { user, profile, initialized, logout } = useAuthStore();

  // Live counters — previously hardcoded to '0' which is why the UI
  // never reflected real activity. Now:
  //   - Orders  → `orders` rows matching user_id
  //   - Favoris → wishlist store (localStorage-backed Zustand)
  //   - Adresses → `addresses` rows matching user_id
  const hydrated = useHydrated();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [orderCount, setOrderCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);

  useEffect(() => {
    if (initialized && !user) {
      router.push('/connexion');
    }
  }, [initialized, user, router]);

  // Fetch counts. Extracted so both the initial mount AND realtime
  // events below can trigger a refresh.
  const refreshCounts = async () => {
    if (!user) return;
    const supabase = createClient();
    const [{ count: orders }, { count: addresses }] = await Promise.all([
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('addresses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);
    setOrderCount(orders ?? 0);
    setAddressCount(addresses ?? 0);
  };

  useEffect(() => {
    if (!user) return;
    refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Realtime: any INSERT/DELETE on orders OR addresses → recount.
  // Enabled only once the user is resolved so we don't subscribe
  // before we know whose rows to watch.
  useRealtimeTable({
    table: 'orders',
    onChange: () => refreshCounts(),
    enabled: !!user,
  });
  useRealtimeTable({
    table: 'addresses',
    onChange: () => refreshCounts(),
    enabled: !!user,
  });

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
    router.push('/');
  };

  if (!initialized || !user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName = profile?.first_name || user.email?.split('@')[0] || 'Client';

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold text-dark mb-2">
            {t('dashboard')}
          </h1>
          <p className="text-text-body mb-8">
            {t('welcome', { name: displayName })}
          </p>
        </motion.div>

        {/* User info card */}
        <div className="bg-white border border-border p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gold flex items-center justify-center text-white font-bold text-xl">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-dark">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-sm text-text-body">{user.email}</p>
              {profile?.phone && <p className="text-sm text-text-body">{profile.phone}</p>}
            </div>
          </div>
        </div>

        {/* Quick stats — now live. wishlistCount gated by `hydrated`
            so SSR and client render the same value (no hydration warning). */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Commandes', value: String(orderCount), icon: Package },
            { label: 'Favoris',   value: hydrated ? String(wishlistCount) : '0', icon: Heart },
            { label: 'Adresses',  value: String(addressCount), icon: MapPin },
          ].map(({ label, value, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-border p-5 text-center"
            >
              <Icon size={22} className="mx-auto text-gold mb-2" />
              <p className="text-2xl font-bold text-dark">{value}</p>
              <p className="text-xs text-text-body">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Menu */}
        <div className="bg-white border border-border overflow-hidden mb-6">
          {menuItems.map(({ href, icon: Icon, key }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={href}
                className="flex items-center gap-4 p-4 hover:bg-cream transition-colors border-b border-border/50 last:border-0"
              >
                <div className="w-10 h-10 bg-cream flex items-center justify-center">
                  <Icon size={20} className="text-gold" />
                </div>
                <span className="flex-1 font-medium text-dark text-sm">{t(key)}</span>
                <ChevronRight size={16} className="text-text-body rtl:rotate-180" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Logout */}
        <Button variant="ghost" fullWidth onClick={handleLogout} className="text-red-500 hover:bg-red-50">
          <LogOut size={18} />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
