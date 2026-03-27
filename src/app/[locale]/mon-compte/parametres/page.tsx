'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { updateProfile } from '@/lib/supabase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, User, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const { user, profile, initialized, loadUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    if (initialized && !user) { router.push('/connexion'); return; }
    if (profile) {
      setForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      });
    }
  }, [initialized, user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      await loadUser();
      toast.success('Profil mis à jour');
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
    setSaving(false);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link href="/mon-compte" className="inline-flex items-center gap-1 text-sm text-text-body hover:text-gold mb-6">
          <ChevronLeft size={16} className="rtl:rotate-180" /> {t('dashboard')}
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading text-2xl font-bold text-dark mb-6"
        >
          {t('settings')}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-border p-6 sm:p-8"
        >
          <h2 className="font-heading text-lg font-semibold text-dark mb-5">Informations personnelles</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="first_name"
                label="Prénom"
                icon={<User size={18} />}
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
              <Input
                id="last_name"
                label="Nom"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>

            <Input
              id="phone"
              label="Téléphone"
              type="tel"
              icon={<Phone size={18} />}
              placeholder="+213..."
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">Email</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-cream border border-border text-sm text-text-body">
                <Mail size={18} />
                {user?.email}
              </div>
              <p className="text-xs text-text-body mt-1">L&apos;email ne peut pas être modifié</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={saving}>
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
