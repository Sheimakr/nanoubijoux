'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { X } from 'lucide-react';
import { LanguageSwitcher } from '../shared/language-switcher';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { href: '/', key: 'home' },
  { href: '/boutique', key: 'shop' },
  { href: '/a-propos', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/blog', key: 'blog' },
  { href: '/livraison', key: 'shipping' },
] as const;

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const t = useTranslations('nav');

  return (
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
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-50 lg:hidden shadow-2xl rtl:left-auto rtl:right-0"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <span className="font-heading text-xl font-bold text-dark">Nano Bijoux</span>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-light transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="py-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block py-3 px-5 text-dark hover:text-gold hover:bg-cream font-medium transition-colors border-b border-border/50"
                  >
                    {t(link.key)}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-border">
              <LanguageSwitcher />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
