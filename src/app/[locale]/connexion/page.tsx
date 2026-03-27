'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Connexion réussie !');
      router.push('/mon-compte');
    } catch (error: any) {
      toast.error(error?.message || 'Email ou mot de passe incorrect');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[80vh] bg-cream flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-8 sm:p-10 border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-dark flex items-center justify-center mb-4">
              <span className="text-gold font-heading font-bold text-2xl">NB</span>
            </div>
            <h1 className="font-heading text-2xl font-bold text-dark">
              {t('loginTitle')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label={t('email')}
              type="email"
              placeholder="email@example.com"
              icon={<Mail size={18} />}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <Input
                id="password"
                label={t('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={<Lock size={18} />}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-text-body hover:text-dark rtl:right-auto rtl:left-3"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 border-border text-gold focus:ring-gold" />
                <span className="text-dark-light">{t('rememberMe')}</span>
              </label>
              <Link href="/connexion" className="text-gold hover:underline">
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              {t('loginTitle')}
            </Button>
          </form>

          <p className="text-center text-sm text-text-body mt-6">
            {t('noAccount')}{' '}
            <Link href="/inscription" className="text-gold font-medium hover:underline">
              {t('createAccount')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
