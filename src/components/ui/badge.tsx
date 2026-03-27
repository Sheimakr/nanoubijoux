'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'new' | 'sale' | 'outOfStock' | 'default';
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

export function Badge({ variant = 'default', children, className, pulse }: BadgeProps) {
  const variants = {
    new: 'bg-gold text-white',
    sale: 'bg-red-500 text-white',
    outOfStock: 'bg-gray-400 text-white',
    default: 'bg-gold text-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        variants[variant],
        pulse && 'animate-pulse',
        className
      )}
    >
      {children}
    </span>
  );
}
