'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '',
  });

  const updateForm = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (form.password.length < 6) { toast.error('Le mot de passe doit contenir au moins 6 caractères'); return; }

    setIsLoading(true);
    try {
      await register(form.email, form.password, {
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone || undefined,
      });
      toast.success('Compte créé avec succès !');
      router.push('/mon-compte');
    } catch (error: any) {
      toast.error(error?.message || 'Erreur lors de la création du compte');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[80vh] bg-cream flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white p-8 sm:p-10 border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-dark flex items-center justify-center mb-4">
              <span className="text-gold font-heading font-bold text-2xl">NB</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-dark">{t('registerTitle')}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input id="firstName" label="Prénom" placeholder="Prénom" icon={<User size={18} />} required value={form.firstName} onChange={(e) => updateForm('firstName', e.target.value)} />
              <Input id="lastName" label="Nom" placeholder="Nom" required value={form.lastName} onChange={(e) => updateForm('lastName', e.target.value)} />
            </div>
            <Input id="phone" label="Téléphone" type="tel" placeholder="+213..." icon={<Phone size={18} />} value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} />
            <Input id="email" label={t('email')} type="email" placeholder="email@example.com" icon={<Mail size={18} />} required value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
            <div className="relative">
              <Input id="password" label={t('password')} type={showPassword ? 'text' : 'password'} placeholder="••••••••" icon={<Lock size={18} />} required value={form.password} onChange={(e) => updateForm('password', e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-text-body hover:text-dark rtl:right-auto rtl:left-3">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Input id="confirmPassword" label={t('confirmPassword')} type="password" placeholder="••••••••" required value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} />
            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>{t('registerTitle')}</Button>
          </form>

          <p className="text-center text-sm text-text-body mt-6">
            {t('hasAccount')}{' '}
            <Link href="/connexion" className="text-gold font-medium hover:underline">{t('loginHere')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
