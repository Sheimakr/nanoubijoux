'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, ChevronLeft, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';

interface Address {
  id: string;
  full_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address_line: string;
  is_default: boolean;
}

export default function AddressesPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', wilaya: '', commune: '', address_line: '' });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const loadAddresses = async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_default', { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (initialized && !user) { router.push('/connexion'); return; }
    if (user) loadAddresses();
  }, [initialized, user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('addresses').insert({
      ...form,
      user_id: user!.id,
      is_default: addresses.length === 0,
    });
    if (error) { toast.error('Erreur'); setSaving(false); return; }
    toast.success('Adresse ajoutée');
    setShowForm(false);
    setForm({ full_name: '', phone: '', wilaya: '', commune: '', address_line: '' });
    setSaving(false);
    loadAddresses();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    toast.success('Adresse supprimée');
    loadAddresses();
  };

  const handleSetDefault = async (id: string) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    toast.success('Adresse par défaut mise à jour');
    loadAddresses();
  };

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link href="/mon-compte" className="inline-flex items-center gap-1 text-sm text-text-body hover:text-gold mb-6">
          <ChevronLeft size={16} className="rtl:rotate-180" /> {t('dashboard')}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-2xl font-bold text-dark">
            {t('addresses')}
          </motion.h1>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} /> Ajouter
          </Button>
        </div>

        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAdd}
            className="bg-white border border-border p-6 mb-6 space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <Input id="full_name" label="Nom complet" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <Input id="phone" label="Téléphone" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input id="wilaya" label="Wilaya" required value={form.wilaya} onChange={(e) => setForm({ ...form, wilaya: e.target.value })} />
              <Input id="commune" label="Commune" required value={form.commune} onChange={(e) => setForm({ ...form, commune: e.target.value })} />
            </div>
            <Input id="address_line" label="Adresse complète" required value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button type="submit" isLoading={saving}>Enregistrer</Button>
            </div>
          </motion.form>
        )}

        {addresses.length === 0 && !showForm ? (
          <div className="bg-white border border-border p-12 text-center">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-text-body">Aucune adresse enregistrée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr, i) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-border p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-dark">{addr.full_name}</span>
                      {addr.is_default && (
                        <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full font-medium">Par défaut</span>
                      )}
                    </div>
                    <p className="text-sm text-text-body">{addr.phone}</p>
                    <p className="text-sm text-text-body mt-1">{addr.address_line}</p>
                    <p className="text-sm text-text-body">{addr.commune}, {addr.wilaya}</p>
                  </div>
                  <div className="flex gap-2">
                    {!addr.is_default && (
                      <button onClick={() => handleSetDefault(addr.id)} className="p-2 text-text-body hover:text-gold" title="Définir par défaut">
                        <Star size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(addr.id)} className="p-2 text-text-body hover:text-red-500" title="Supprimer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
