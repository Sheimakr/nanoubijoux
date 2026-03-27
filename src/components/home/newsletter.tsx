'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { subscribeNewsletter } from '@/lib/supabase/queries';

export function Newsletter() {
  const t = useTranslations('home');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await subscribeNewsletter(email);
      toast.success('Merci pour votre inscription !');
      setEmail('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur, réessayez.');
    }
    setIsSubmitting(false);
  };

  return (
    <section className="py-12 sm:py-16 bg-dark">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3">
            {t('newsletter')}
          </h2>
          <p className="text-white/60 mb-8">
            {t('newsletterDesc')}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              required
              className="flex-1 px-5 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-gold focus:outline-none text-sm"
            />
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="whitespace-nowrap"
            >
              <Send size={16} />
              {t('subscribe')}
            </Button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
