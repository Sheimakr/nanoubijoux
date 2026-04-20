'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
// TikTok (MessageCircle) + Telegram (Send) icons removed from the
// "Follow Us" block per owner request — only Instagram + Facebook remain.
import { Instagram, Facebook } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
// NOTE: CONTACT_EMAIL removed — email now comes from the settings store (DB).

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();

  const { store_name, phone, email, instagram, facebook, fetchSettings, loaded } =
    useSettingsStore();

  useEffect(() => {
    if (!loaded) fetchSettings();
  }, [loaded, fetchSettings]);

  return (
    <footer className="bg-white border-t border-border">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <span className="font-heading text-xl font-bold text-dark block mb-3">
              {store_name}
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
                // FAQ link removed per owner request.
                { href: '/boutique', label: tNav('shop') },
                { href: '/a-propos', label: tNav('about') },
                { href: '/livraison', label: tNav('shipping') },
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
              {/* Phone — hide the whole line if the DB field is empty */}
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="hover:text-gold transition-colors"
                  >
                    {phone}
                  </a>
                </li>
              )}
              {/* Email — hide the whole line if the DB field is empty */}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="hover:text-gold transition-colors"
                  >
                    {email}
                  </a>
                </li>
              )}
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
                { href: instagram, icon: Instagram, label: 'Instagram' },
                { href: facebook,  icon: Facebook,  label: 'Facebook' },
              ]
                // Drop entries whose DB-backed URL is empty so we don't
                // render dead anchors when admin hasn't set them yet.
                .filter(({ href }) => href && href.length > 0)
                .map(({ href, icon: Icon, label }) => (
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
          <p>{store_name} DZ.© {year}. {t('rights', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
