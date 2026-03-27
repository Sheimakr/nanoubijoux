'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useState } from 'react';

export function AnnouncementBar() {
  const t = useTranslations('announcement');
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-dark text-white text-center py-2 px-4 text-sm font-medium relative">
      <p>{t('discount')}</p>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity rtl:right-auto rtl:left-3"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}
