import { type ClassValue, clsx } from 'clsx';

// Simple cn utility without tailwind-merge dependency
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Re-export clsx for convenience
export { clsx };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLocalizedField(
  obj: any,
  field: string,
  locale: string
): string {
  return (obj[`${field}_${locale}`] as string) || (obj[`${field}_fr`] as string) || '';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function calculateDiscount(subtotal: number, itemCount: number): number {
  if (itemCount >= 3) {
    return Math.round(subtotal * 0.1);
  }
  return 0;
}
