import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { WhatsAppButton } from '@/components/shared/whatsapp-button';
import { ScrollToTop } from '@/components/shared/scroll-to-top';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/shared/auth-provider';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = locale === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'}>
      <NextIntlClientProvider messages={messages}>
        <AuthProvider>
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
        <ScrollToTop />
        <Toaster
          position={isRtl ? 'top-left' : 'top-right'}
          toastOptions={{
            style: {
              background: '#1A1A2E',
              color: 'white',
              border: '1px solid rgba(197, 145, 44, 0.3)',
            },
          }}
        />
      </AuthProvider>
      </NextIntlClientProvider>
    </div>
  );
}
