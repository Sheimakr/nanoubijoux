'use client';

import { useEffect, useState } from 'react';
import {
  Save,
  Settings as SettingsIcon,
  Truck,
  Globe,
  ImageIcon,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadProductImage } from '@/lib/supabase/admin-queries';

/**
 * Site-wide configuration stored in the `settings` table.
 * Keep this interface in sync with:
 *   - src/lib/settings.ts (server helper)
 *   - supabase/migrations/*_settings.sql
 */
interface StoreSettings {
  store_name: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  primary_color: string;
  // Homepage hero slider — array of image URLs (Supabase Storage).
  hero_images: string[];
  ecotrack_token: string;
  ecotrack_enabled: boolean;
  ecotrack_api_url: string;
}

const DEFAULTS: StoreSettings = {
  store_name: 'Nano Bijoux',
  phone: '',
  email: '',
  facebook: '',
  instagram: '',
  primary_color: '#B8860B',
  hero_images: [],
  ecotrack_token: '',
  ecotrack_enabled: false,
  ecotrack_api_url: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  // Track per-file upload state so multiple concurrent uploads don't
  // collide with a single boolean.
  const [heroUploading, setHeroUploading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        // Merge fetched row into defaults — coerces nulls and keeps shape.
        const merged: StoreSettings = { ...DEFAULTS };
        if (data && typeof data === 'object') {
          for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
            if (!(key in DEFAULTS)) continue;
            const defaultVal = (DEFAULTS as unknown as Record<string, unknown>)[key];
            if (val === null || val === undefined) continue;
            if (typeof defaultVal === 'boolean') {
              (merged as unknown as Record<string, unknown>)[key] = Boolean(val);
            } else if (typeof defaultVal === 'string') {
              (merged as unknown as Record<string, unknown>)[key] = String(val);
            } else {
              (merged as unknown as Record<string, unknown>)[key] = val;
            }
          }
        }
        setSettings(merged);
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        toast.error('Erreur lors de la sauvegarde');
        return;
      }
      // The PUT handler calls revalidateTag('settings'), so the homepage
      // footer/contact widgets will reflect the new values on next render.
      toast.success('Paramètres enregistrés');
    } finally {
      setSaving(false);
    }
  };

  const testEcotrack = async () => {
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ecotrack/communes?wilaya_id=16');
      if (res.ok) {
        setTestResult('Connexion EcoTrack réussie !');
      } else {
        const data = await res.json();
        setTestResult(`Erreur: ${data.error || 'Connexion échouée'}`);
      }
    } catch {
      setTestResult('Erreur réseau');
    }
  };

  const update = (field: keyof StoreSettings, value: string | boolean) => {
    setSettings((s) => ({ ...s, [field]: value }));
  };

  /**
   * Upload one or more files to Supabase Storage, append the resulting
   * public URLs to settings.hero_images. Admin still has to press the
   * main "Enregistrer" button to persist — this matches every other
   * field in the form.
   */
  const handleHeroUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setHeroUploading(true);
    try {
      const uploaded: string[] = [];
      // Upload sequentially to keep the progress UX predictable.
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file);
        uploaded.push(url);
      }
      setSettings((s) => ({
        ...s,
        hero_images: [...(s.hero_images || []), ...uploaded],
      }));
      toast.success(
        uploaded.length === 1
          ? 'Image ajoutée'
          : `${uploaded.length} images ajoutées`,
      );
    } catch (err) {
      console.error('[hero upload]', err);
      toast.error("Erreur lors de l'upload");
    } finally {
      setHeroUploading(false);
    }
  };

  const removeHeroImage = (index: number) => {
    setSettings((s) => ({
      ...s,
      hero_images: s.hero_images.filter((_, i) => i !== index),
    }));
  };

  const moveHeroImage = (index: number, direction: -1 | 1) => {
    setSettings((s) => {
      const next = [...s.hero_images];
      const target = index + direction;
      if (target < 0 || target >= next.length) return s;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...s, hero_images: next };
    });
  };

  // Instagram feed upload/reorder/remove handlers removed per owner request.

  if (loading) {
    return <div className="p-12 text-center text-gray-400">Chargement...</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500">
          Configuration du site, intégrations et raccourcis de gestion
        </p>
      </div>

      {/* ───────────── Website Info ───────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
          <Globe size={18} className="text-amber-600" /> Informations du site
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Ces informations s&apos;affichent en temps réel sur la page d&apos;accueil
          (pied de page, contact) après enregistrement.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Nom du site
            </label>
            <input
              value={settings.store_name}
              onChange={(e) => update('store_name', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Téléphone
              </label>
              <input
                value={settings.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+213 ..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="contact@..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Facebook
              </label>
              <input
                value={settings.facebook}
                onChange={(e) => update('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Instagram
              </label>
              <input
                value={settings.instagram}
                onChange={(e) => update('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Hero Images (homepage slider) ─────────────
          Admin can upload multiple images; they appear on the homepage
          as the hero slider (auto-advances every 5s). Drag is not yet
          implemented — use the ↑ ↓ buttons to reorder. */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-1">
          <ImageIcon size={18} className="text-amber-600" /> Images de la page d&apos;accueil
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Les images s&apos;affichent en slider sur la page d&apos;accueil (défilement automatique).
          Formats recommandés : 1920×1080 px, JPEG.
        </p>

        {/* Thumbnails grid */}
        {settings.hero_images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {settings.hero_images.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Hero ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Position badge */}
                <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold rounded px-1.5 py-0.5">
                  #{idx + 1}
                </div>

                {/* Controls — visible on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveHeroImage(idx, -1)}
                    disabled={idx === 0}
                    className="bg-white text-gray-700 rounded-full p-1.5 hover:bg-amber-100 disabled:opacity-30"
                    title="Monter"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveHeroImage(idx, 1)}
                    disabled={idx === settings.hero_images.length - 1}
                    className="bg-white text-gray-700 rounded-full p-1.5 hover:bg-amber-100 disabled:opacity-30"
                    title="Descendre"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeHeroImage(idx)}
                    className="bg-white text-red-600 rounded-full p-1.5 hover:bg-red-50"
                    title="Supprimer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload button — accepts multiple files at once */}
        <label
          className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition ${
            heroUploading
              ? 'border-gray-200 bg-gray-50 cursor-wait'
              : 'border-gray-300 hover:border-amber-500 hover:bg-amber-50'
          }`}
        >
          <Upload size={20} className="text-gray-400 mb-1" />
          <span className="text-xs text-gray-500">
            {heroUploading
              ? 'Upload en cours...'
              : 'Cliquer pour ajouter une ou plusieurs images'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={heroUploading}
            onChange={(e) => {
              handleHeroUpload(e.target.files);
              // Reset so the same file can be re-picked after deletion.
              e.target.value = '';
            }}
          />
        </label>

        <p className="text-[10px] text-gray-400 mt-2">
          N&apos;oubliez pas de cliquer sur « Enregistrer les paramètres » en bas de la page pour appliquer les changements.
        </p>
      </section>

      {/* Instagram feed images section removed per owner request. */}

      {/* ───────────── EcoTrack (existing) ───────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
          <Truck size={18} className="text-amber-600" /> EcoTrack
        </h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.ecotrack_enabled}
              onChange={(e) => update('ecotrack_enabled', e.target.checked)}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Activer EcoTrack
            </span>
          </label>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Token API
            </label>
            <input
              type="password"
              value={settings.ecotrack_token}
              onChange={(e) => update('ecotrack_token', e.target.value)}
              placeholder="Bearer token (64 caractères)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              URL API (base)
            </label>
            <input
              value={settings.ecotrack_api_url}
              onChange={(e) => update('ecotrack_api_url', e.target.value)}
              placeholder="https://dhd.ecotrack.dz/api/v1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-amber-500 outline-none"
            />
          </div>
          <button
            onClick={testEcotrack}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Tester la connexion
          </button>
          {testResult && (
            <div
              className={`rounded-lg p-3 text-sm ${
                testResult.startsWith('Erreur')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-green-50 text-green-700'
              }`}
            >
              {testResult}
            </div>
          )}
        </div>
      </section>

      {/* Sticky save button at the bottom of the page */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-amber-400"
        >
          {saving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Save size={16} />
          )}
          Enregistrer les paramètres
        </button>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <SettingsIcon size={12} /> Les changements sont instantanés sur le site
        </span>
      </div>
    </div>
  );
}
