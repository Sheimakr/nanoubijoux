'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';

// Fallback slides used when the admin hasn't uploaded any hero images yet.
// They reference /public/images/hero-*.jpg which existed historically.
// Title / subtitle / CTA come from the i18n `home.*` namespace so they
// localize automatically across fr/ar/en.
const FALLBACK_SLIDES = [
  {
    image: '/images/hero-1.jpg',
    titleKey: 'heroTitle',
    subtitleKey: 'heroSubtitle',
    ctaKey: 'heroCta',
    ctaLink: '/boutique',
  },
  {
    image: '/images/hero-2.jpg',
    titleKey: 'heroTitle2',
    subtitleKey: 'heroSubtitle2',
    ctaKey: 'heroCta2',
    ctaLink: '/boutique',
  },
];

export function HeroSlider() {
  const t = useTranslations('home');
  const [current, setCurrent] = useState(0);

  // Pull the admin-managed hero images from the settings store (live via
  // Supabase Realtime — updates here without a page refresh).
  const { hero_images, fetchSettings, loaded } = useSettingsStore();

  useEffect(() => {
    if (!loaded) fetchSettings();
  }, [loaded, fetchSettings]);

  /**
   * Build the slide list. If the admin has uploaded at least one image,
   * use those exclusively (and cycle through built-in i18n text on each
   * slide). Otherwise fall back to the two hardcoded slides so first-run
   * installs don't show a blank hero.
   */
  const slides = useMemo(() => {
    if (hero_images && hero_images.length > 0) {
      return hero_images.map((url, idx) => ({
        image: url,
        // Alternate between the two i18n key pairs so a long slideshow
        // doesn't keep repeating the same text.
        titleKey:    idx % 2 === 0 ? 'heroTitle'    : 'heroTitle2',
        subtitleKey: idx % 2 === 0 ? 'heroSubtitle' : 'heroSubtitle2',
        ctaKey:      idx % 2 === 0 ? 'heroCta'      : 'heroCta2',
        ctaLink: '/boutique',
      }));
    }
    return FALLBACK_SLIDES;
  }, [hero_images]);

  const slideCount = slides.length;

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  // Reset index if the slide list shrinks (e.g. admin deletes images).
  useEffect(() => {
    if (current >= slideCount) setCurrent(0);
  }, [current, slideCount]);

  useEffect(() => {
    // Don't auto-advance if there's only one slide.
    if (slideCount <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, slideCount]);

  return (
    <section className="relative min-h-[420px] sm:min-h-[500px] lg:min-h-[700px] overflow-hidden bg-cream">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[current].image})` }}
          />
          {/* Light overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content — left aligned like Soltana */}
      <div className="relative z-10 h-full min-h-[420px] sm:min-h-[500px] lg:min-h-[700px] max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <motion.div
          key={`content-${current}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-[490px]"
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-[48px] font-bold text-dark leading-tight mb-4">
            {t(slides[current].titleKey)}
          </h2>
          <p className="text-base text-text-body mb-8 leading-relaxed">
            {t(slides[current].subtitleKey)}
          </p>
          <Link href={slides[current].ctaLink}>
            <Button size="lg" variant="primary">
              {t(slides[current].ctaKey)}
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white flex items-center justify-center text-dark transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white flex items-center justify-center text-dark transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === current ? 'bg-gold' : 'bg-dark/20 hover:bg-dark/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
