'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionHeading } from '@/components/ui/section-heading';
import { CONTACT_EMAIL, CONTACT_PHONE, WHATSAPP_NUMBER, SOCIAL_LINKS } from '@/lib/constants';
import { Phone, Mail, MapPin, MessageCircle, Instagram, Facebook, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { sendContactMessage } from '@/lib/supabase/queries';

const faqs = [
  {
    q_fr: 'Quels types de produits proposez-vous ?',
    q_en: 'What types of products do you offer?',
    q_ar: 'ما هي أنواع المنتجات التي تقدمونها؟',
    a_fr: 'Nous proposons des bijoux en acier inoxydable : bagues, colliers, bracelets, boucles d\'oreilles, parures, montres et accessoires.',
    a_en: 'We offer stainless steel jewelry: rings, necklaces, bracelets, earrings, sets, watches and accessories.',
    a_ar: 'نقدم مجوهرات من الفولاذ المقاوم للصدأ: خواتم، قلادات، أساور، أقراط، أطقم، ساعات وإكسسوارات.',
  },
  {
    q_fr: 'Quelle est la qualité de vos produits ?',
    q_en: 'What is the quality of your products?',
    q_ar: 'ما هي جودة منتجاتكم؟',
    a_fr: 'Tous nos bijoux sont en acier inoxydable 316L, résistant à l\'eau et à l\'usure quotidienne. Ils sont plaqués or 18 carats.',
    a_en: 'All our jewelry is made of 316L stainless steel, resistant to water and daily wear. They are 18k gold plated.',
    a_ar: 'جميع مجوهراتنا مصنوعة من الفولاذ المقاوم للصدأ 316L، مقاومة للماء والاستعمال اليومي. مطلية بالذهب عيار 18 قيراط.',
  },
  {
    q_fr: 'Quels sont les délais de livraison ?',
    q_en: 'What are the delivery times?',
    q_ar: 'ما هي مدة التوصيل؟',
    a_fr: 'La livraison est effectuée sous 1 à 2 jours ouvrables dans les 58 wilayas d\'Algérie.',
    a_en: 'Delivery is made within 1 to 2 business days across all 58 wilayas of Algeria.',
    a_ar: 'يتم التوصيل خلال 1 إلى 2 أيام عمل عبر 58 ولاية في الجزائر.',
  },
  {
    q_fr: 'Acceptez-vous les retours ?',
    q_en: 'Do you accept returns?',
    q_ar: 'هل تقبلون الإرجاع؟',
    a_fr: 'Pour maintenir nos prix compétitifs, nous ne proposons pas de retours. Nous vous invitons à nous contacter via WhatsApp pour toute question avant achat.',
    a_en: 'To maintain our competitive prices, we do not offer returns. We invite you to contact us via WhatsApp for any questions before purchasing.',
    a_ar: 'للحفاظ على أسعارنا التنافسية، لا نقبل الإرجاع. ندعوكم للتواصل معنا عبر واتساب لأي استفسار قبل الشراء.',
  },
];

function FAQItem({ faq, locale }: { faq: typeof faqs[0]; locale: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const q = locale === 'ar' ? faq.q_ar : locale === 'en' ? faq.q_en : faq.q_fr;
  const a = locale === 'ar' ? faq.a_ar : locale === 'en' ? faq.a_en : faq.a_fr;

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="font-medium text-dark text-sm sm:text-base pr-4">{q}</span>
        <ChevronDown
          size={18}
          className={cn('text-gold flex-shrink-0 transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

export default function ContactPage() {
  const t = useTranslations('contact');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    try {
      await sendContactMessage({
        name: data.get('name') as string,
        email: data.get('email') as string || undefined,
        phone: data.get('phone') as string || undefined,
        message: data.get('message') as string,
      });
      toast.success(t('sent'));
      form.reset();
    } catch {
      toast.error('Erreur, réessayez.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-cream border-b border-border py-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl font-bold text-dark"
          >
            {t('title')}
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input id="name" name="name" label={t('name')} placeholder={t('name')} required />
              <Input id="email" name="email" label={t('email')} type="email" placeholder={t('email')} required />
              <Input id="phone" name="phone" label={t('phone')} type="tel" placeholder="+213..." />
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">{t('message')}</label>
                <textarea
                  name="message"
                  rows={5}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-gray-400 focus:border-gold focus:ring-2 focus:ring-gold/20 focus:outline-none transition-all resize-none"
                  placeholder={t('message')}
                />
              </div>
              <Button type="submit" size="lg" isLoading={isSubmitting}>
                {t('send')}
              </Button>
            </form>
          </motion.div>

          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              {[
                { icon: Phone, text: CONTACT_PHONE, href: `tel:${CONTACT_PHONE.replace(/\s/g, '')}` },
                { icon: Mail, text: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
                { icon: MessageCircle, text: 'WhatsApp', href: `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}` },
                { icon: MapPin, text: 'Algérie - 58 Wilayas', href: null },
              ].map(({ icon: Icon, text, href }) => (
                <div key={text} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-gold" />
                  </div>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-charcoal hover:text-gold transition-colors">
                      {text}
                    </a>
                  ) : (
                    <span className="text-charcoal">{text}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-3">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center hover:bg-gold hover:text-white text-charcoal transition-colors">
                <Instagram size={20} />
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center hover:bg-gold hover:text-white text-charcoal transition-colors">
                <Facebook size={20} />
              </a>
            </div>
          </motion.div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <SectionHeading title={t('faqTitle')} />
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-6">
            {faqs.map((faq, i) => (
              <FAQItem key={i} faq={faq} locale="fr" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
