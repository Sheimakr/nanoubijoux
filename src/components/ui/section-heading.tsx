'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  label?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function SectionHeading({ title, subtitle, label, className, align = 'center' }: SectionHeadingProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4 }}
      className={cn('mb-8', alignClasses[align], className)}
    >
      {label && (
        <p className="text-sm font-semibold text-gold uppercase tracking-widest mb-2">
          {label}
        </p>
      )}
      <h2 className="font-heading text-2xl md:text-3xl font-bold text-dark">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-text-body text-base">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
