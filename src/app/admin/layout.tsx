'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  FileText,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Store,
  Truck,
  Code,
  Shield,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
  permissions: string[];
}

const sidebarLinks = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/commandes', label: 'Commandes', icon: ShoppingCart },
  // Categories / Brands / Materials are now sub-tabs inside "Produits"
  // (the catalog hub) — intentionally not in the sidebar anymore.
  // Their standalone URLs still work if you hit them directly.
  { href: '/admin/produits', label: 'Produits', icon: Package },
  { href: '/admin/delivery', label: 'Livraison', icon: Truck },
  { href: '/admin/pixels', label: 'Pixels', icon: Code },
  // Clients section removed per owner request. Page + API route deleted.
  { href: '/admin/admins', label: 'Admins', icon: Shield, permission: 'users:manage' },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings, permission: 'settings:manage' },
  // Coupons is finance-sensitive — only super admins (role==='admin')
  // pass the canSee() check. Agents won't see it in the sidebar at all.
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket, permission: 'coupons:manage' },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const isLoginPage = pathname === '/admin/login';

  // Fetch admin user from JWT cookie (skip on login page)
  useEffect(() => {
    if (isLoginPage) return;
    fetch('/api/admin/auth')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) setAdminUser(data.user);
        else router.push('/admin/login');
      })
      .catch(() => router.push('/admin/login'));
  }, [router, isLoginPage]);

  // Login page renders without the dashboard shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const canSee = (link: typeof sidebarLinks[0]) => {
    if (!link.permission) return true;
    if (!adminUser) return false;
    if (adminUser.role === 'admin') return true;
    return adminUser.permissions.includes(link.permission);
  };

  const visibleLinks = sidebarLinks.filter(canSee);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-2">
            <Store size={22} className="text-gold" />
            <span className="font-heading font-bold text-lg text-dark">Nano Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-gold/10 text-gold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-dark'
                )}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/fr"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gold mb-3"
          >
            <ChevronLeft size={16} />
            Retour au site
          </Link>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 truncate">
              {adminUser?.displayName || adminUser?.username || '...'}
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-dark"
          >
            <Menu size={20} />
          </button>
          <h1 className="ml-2 lg:ml-0 font-heading font-semibold text-lg text-dark">
            {visibleLinks.find(l => isActive(l.href))?.label || 'Admin'}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
