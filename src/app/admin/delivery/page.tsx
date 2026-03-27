'use client';

import { useEffect, useState } from 'react';
import { Save, Truck } from 'lucide-react';

interface Wilaya {
  id: number;
  name_fr: string;
  name?: string;
  shipping_fee: number;
  home_fee: number;
  desk_fee: number;
  free_from: number;
}

export default function DeliveryPage() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/delivery')
      .then(r => r.json())
      .then(data => { setWilayas(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const updateWilaya = (id: number, field: string, value: number) => {
    setWilayas(ws => ws.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const saveAll = async () => {
    setSaving(true);
    await fetch('/api/admin/delivery', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wilayas),
    });
    setSaving(false);
  };

  const filtered = wilayas.filter(w =>
    (w.name_fr || w.name || '')?.toLowerCase().includes(search.toLowerCase()) || String(w.id).includes(search)
  );

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarifs de livraison</h1>
          <p className="text-sm text-gray-500">Configurez les prix par wilaya</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-amber-400">
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={16} />}
          Enregistrer tout
        </button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher une wilaya..."
        className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none"
      />

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Wilaya</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Domicile (DA)</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Stop Desk (DA)</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Gratuit dès (DA)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(w => (
              <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-2 text-gray-400">{w.id}</td>
                <td className="px-4 py-2 font-medium text-gray-900">{w.name_fr || w.name}</td>
                <td className="px-4 py-2">
                  <input type="number" value={w.home_fee ?? w.shipping_fee ?? 0} onChange={e => updateWilaya(w.id, 'home_fee', Number(e.target.value))} className="w-24 mx-auto block rounded border border-gray-200 px-2 py-1 text-center text-sm focus:border-amber-500 outline-none" />
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={w.desk_fee ?? 0} onChange={e => updateWilaya(w.id, 'desk_fee', Number(e.target.value))} className="w-24 mx-auto block rounded border border-gray-200 px-2 py-1 text-center text-sm focus:border-amber-500 outline-none" />
                </td>
                <td className="px-4 py-2">
                  <input type="number" value={w.free_from ?? 0} onChange={e => updateWilaya(w.id, 'free_from', Number(e.target.value))} className="w-24 mx-auto block rounded border border-gray-200 px-2 py-1 text-center text-sm focus:border-amber-500 outline-none" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
