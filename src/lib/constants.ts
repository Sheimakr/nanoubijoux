// ============================================
// Nano Bijoux — Constants
// ============================================

export const SITE_NAME = 'Nano Bijoux';
export const SITE_TAGLINE = 'Votre boutique d\'accessoires en ligne';
export const SITE_URL = 'https://nanobijoux.dz';

export const WHATSAPP_NUMBER = '+213549631236';
export const CONTACT_EMAIL = 'contact@nanobijoux.dz';
export const CONTACT_PHONE = '+213 549 63 12 36';

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/nano31bijoux/',
  facebook: '#',
  tiktok: '#',
  telegram: '#',
};

export const CURRENCY = {
  code: 'DZD',
  symbol: 'DA',
  locale: 'fr-DZ',
};

export const CATEGORIES = [
  { slug: 'bagues', icon: '💍' },
  { slug: 'colliers', icon: '📿' },
  { slug: 'bracelets', icon: '⌚' },
  { slug: 'boucles-oreilles', icon: '✨' },
  { slug: 'gourmettes', icon: '🔗' },
  { slug: 'parures', icon: '👑' },
  { slug: 'montres', icon: '⏱️' },
  { slug: 'accessoires', icon: '👜' },
  { slug: 'foulards', icon: '🧣' },
  { slug: 'porte-monnaie', icon: '👛' },
  { slug: 'chaines-cheville', icon: '🦶' },
] as const;

export const BRANDS = [
  'Cartier', 'Chanel', 'Dior', 'Gucci', 'Hermès',
  'Louis Vuitton', 'Versace', 'Bvlgari', 'Fendi',
  'Armani', 'Rolex', 'Casio', 'Yves Saint Laurent',
] as const;

export const DISCOUNT_THRESHOLD = 3; // 10% off when buying 3+ items
export const DISCOUNT_PERCENTAGE = 10;

export const PRODUCTS_PER_PAGE_OPTIONS = [9, 12, 18, 24] as const;
export const DEFAULT_PRODUCTS_PER_PAGE = 12;

export const LOCALES = ['fr', 'ar', 'en'] as const;
export const DEFAULT_LOCALE = 'fr' as const;

export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('fr-DZ')} DA`;
};
