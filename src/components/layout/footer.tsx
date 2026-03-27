'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Instagram, Facebook, MessageCircle, Send } from 'lucide-react';
import { SOCIAL_LINKS, CONTACT_EMAIL, CONTACT_PHONE } from '@/lib/constants';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <span className="font-heading text-xl font-bold text-dark block mb-3">
              Nano Bijoux
            </span>
            <p className="text-text-body text-sm leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <h3 className="text-sm font-semibold text-dark uppercase tracking-wider mb-4">
              {t('usefulLinks')}
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/boutique', label: tNav('shop') },
                { href: '/a-propos', label: tNav('about') },
                { href: '/livraison', label: tNav('shipping') },
                { href: '/faq', label: tNav('faq') },
                { href: '/blog', label: tNav('blog') },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text-body hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-dark uppercase tracking-wider mb-4">
              {t('contactUs')}
            </h3>
            <ul className="space-y-2 text-sm text-text-body">
              <li>
                <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className="hover:text-gold transition-colors">
                  {CONTACT_PHONE}
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-gold transition-colors">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>Algérie - 58 Wilayas</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm font-semibold text-dark uppercase tracking-wider mb-4">
              {t('followUs')}
            </h3>
            <div className="flex items-center gap-3">
              {[
                { href: SOCIAL_LINKS.instagram, icon: Instagram, label: 'Instagram' },
                { href: SOCIAL_LINKS.facebook, icon: Facebook, label: 'Facebook' },
                { href: SOCIAL_LINKS.tiktok, icon: MessageCircle, label: 'TikTok' },
                { href: SOCIAL_LINKS.telegram, icon: Send, label: 'Telegram' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-cream flex items-center justify-center text-dark hover:bg-gold hover:text-white transition-colors"
                  aria-label={label}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border text-center text-sm text-text-body">
          <p>Nano Bijoux DZ.© {year}. {t('rights', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
