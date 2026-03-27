'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Code, Plus, Save, Trash2, X } from 'lucide-react';

interface Pixel {
  id: string;
  name: string;
  type: 'facebook' | 'tiktok' | 'google' | 'other';
  mode: 'id' | 'snippet';
  pixel_id?: string;
  code?: string;
  active: boolean;
}

interface PixelForm {
  name: string;
  type: Pixel['type'];
  mode: Pixel['mode'];
  pixel_id: string;
  code: string;
  active: boolean;
}

const EMPTY_FORM: PixelForm = { name: '', type: 'facebook', mode: 'id', pixel_id: '', code: '', active: true };

export default function PixelsPage() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await fetch('/api/admin/pixels');
    const data = await res.json();
    setPixels(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const valid = form.name.trim() && ((form.mode === 'id' && form.pixel_id.trim()) || (form.mode === 'snippet' && form.code.trim()));
    if (!valid) return;
    setSaving(true);
    await fetch('/api/admin/pixels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/pixels/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !current }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce pixel ?')) return;
    await fetch(`/api/admin/pixels/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pixels de suivi</h1>
          <p className="text-sm text-gray-500">Gérez vos pixels Facebook, TikTok, Google et autres</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus size={16} /> Ajouter un pixel
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Code size={18} className="text-amber-600" /> Nouveau pixel
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Meta Pixel principal" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Plateforme</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Pixel['type'], mode: e.target.value === 'facebook' ? f.mode : 'snippet' }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none">
                <option value="facebook">Meta (Facebook)</option>
                <option value="tiktok">TikTok</option>
                <option value="google">Google Analytics/Ads</option>
                <option value="other">Autre (Snippet)</option>
              </select>
            </div>
            {form.type === 'facebook' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Mode</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, mode: 'id' }))} className={`px-4 py-2 rounded-lg text-sm font-medium border ${form.mode === 'id' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500'}`}>Pixel ID</button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, mode: 'snippet' }))} className={`px-4 py-2 rounded-lg text-sm font-medium border ${form.mode === 'snippet' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500'}`}>Code Snippet</button>
                </div>
              </div>
            )}
            {form.mode === 'id' && form.type === 'facebook' ? (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Pixel ID</label>
                <input value={form.pixel_id} onChange={e => setForm(f => ({ ...f, pixel_id: e.target.value }))} placeholder="123456789012345" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-amber-500 outline-none" />
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Code Snippet</label>
                <textarea value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="<script>...</script>" rows={4} className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-mono text-green-400 focus:border-amber-500 outline-none" />
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-amber-400">
              {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={16} />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-gray-400">Chargement...</div>
      ) : pixels.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <Code size={40} className="mx-auto mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-700">Aucun pixel</h3>
          <p className="text-sm text-gray-400 mt-1">Ajoutez un pixel pour commencer le suivi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pixels.map(pixel => (
            <div key={pixel.id} className={`flex items-center gap-4 rounded-xl border bg-white p-4 ${pixel.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${pixel.type === 'facebook' ? 'bg-blue-50 text-blue-600' : pixel.type === 'tiktok' ? 'bg-gray-900 text-white' : pixel.type === 'google' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                {pixel.type === 'facebook' ? 'f' : pixel.type === 'tiktok' ? 'Tk' : pixel.type === 'google' ? 'G' : '#'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{pixel.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${pixel.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {pixel.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {pixel.type} &middot; {pixel.mode === 'id' ? `ID: ${pixel.pixel_id}` : (pixel.code || '').slice(0, 50)}
                </div>
              </div>
              <button onClick={() => toggleActive(pixel.id, pixel.active)} className={`p-2 rounded-lg ${pixel.active ? 'text-green-500 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-50'}`}>
                <CheckCircle2 size={18} />
              </button>
              <button onClick={() => remove(pixel.id)} className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
