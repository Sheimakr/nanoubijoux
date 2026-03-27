'use client';

import { useEffect, useState } from 'react';
import { Save, Settings, Truck } from 'lucide-react';

interface StoreSettings {
  store_name: string;
  phone: string;
  facebook: string;
  instagram: string;
  primary_color: string;
  ecotrack_token: string;
  ecotrack_enabled: boolean;
  ecotrack_api_url: string;
}

const DEFAULTS: StoreSettings = {
  store_name: 'Nano Bijoux',
  phone: '',
  facebook: '',
  instagram: '',
  primary_color: '#B8860B',
  ecotrack_token: '',
  ecotrack_enabled: false,
  ecotrack_api_url: '',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        // Merge with defaults, converting nulls to empty strings/false
        const merged: StoreSettings = { ...DEFAULTS };
        if (data && typeof data === 'object') {
          for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
            if (key in DEFAULTS) {
              const defaultVal = (DEFAULTS as unknown as Record<string, unknown>)[key];
              if (val === null || val === undefined) {
                // Keep default
              } else if (typeof defaultVal === 'boolean') {
                (merged as unknown as Record<string, unknown>)[key] = Boolean(val);
              } else if (typeof defaultVal === 'string') {
                (merged as unknown as Record<string, unknown>)[key] = String(val);
              } else {
                (merged as unknown as Record<string, unknown>)[key] = val;
              }
            }
          }
        }
        setSettings(merged);
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
  };

  const testEcotrack = async () => {
    setTestResult(null);
    try {
      const res = await fetch(`/api/admin/ecotrack/communes?wilaya_id=16`);
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

  const update = (field: string, value: string | boolean) => {
    setSettings(s => ({ ...s, [field]: value }));
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500">Configuration de la boutique et intégrations</p>
      </div>

      {/* Store Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
          <Settings size={18} className="text-amber-600" /> Boutique
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nom de la boutique</label>
            <input value={settings.store_name} onChange={e => update('store_name', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Téléphone</label>
            <input value={settings.phone} onChange={e => update('phone', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Facebook</label>
              <input value={settings.facebook} onChange={e => update('facebook', e.target.value)} placeholder="https://facebook.com/..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
              <input value={settings.instagram} onChange={e => update('instagram', e.target.value)} placeholder="https://instagram.com/..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
            </div>
          </div>
          {/* Color/theme settings removed — fixed branding */}
        </div>
      </div>

      {/* EcoTrack Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
          <Truck size={18} className="text-amber-600" /> EcoTrack
        </h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={settings.ecotrack_enabled} onChange={e => update('ecotrack_enabled', e.target.checked)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
            <span className="text-sm font-medium text-gray-700">Activer EcoTrack</span>
          </label>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Token API</label>
            <input type="password" value={settings.ecotrack_token} onChange={e => update('ecotrack_token', e.target.value)} placeholder="Bearer token (64 caractères)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-amber-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">URL API (base)</label>
            <input value={settings.ecotrack_api_url} onChange={e => update('ecotrack_api_url', e.target.value)} placeholder="https://dhd.ecotrack.dz/api/v1" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-amber-500 outline-none" />
          </div>
          <button onClick={testEcotrack} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Tester la connexion
          </button>
          {testResult && (
            <div className={`rounded-lg p-3 text-sm ${testResult.startsWith('Erreur') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {testResult}
            </div>
          )}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-amber-400">
        {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={16} />}
        Enregistrer les paramètres
      </button>
    </div>
  );
}
