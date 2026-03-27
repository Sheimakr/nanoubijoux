'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Ticket, Check, X, Copy } from 'lucide-react';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/supabase/admin-queries';
import { getErrorMessage } from '@/lib/error-utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', min_order_amount: '', usage_limit: '', ends_at: '' });

  const fetchCoupons = async () => {
    setLoading(true);
    try { setCoupons(await getAllCoupons()); } catch (e) { toast.error(getErrorMessage(e)); }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const resetForm = () => setForm({ code: '', type: 'percentage', value: '', min_order_amount: '', usage_limit: '', ends_at: '' });

  const handleCreate = async () => {
    if (!form.code || !form.value) return;
    try {
      await createCoupon({
        code: form.code.toUpperCase(),
        type: form.type as 'percentage' | 'fixed',
        value: Number(form.value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : undefined,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
        expires_at: form.ends_at || '',
        is_active: true,
      });
      toast.success('Coupon créé');
      setIsAdding(false);
      resetForm();
      fetchCoupons();
    } catch { toast.error('Erreur'); }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateCoupon(editingId, {
        code: form.code.toUpperCase(),
        type: form.type as 'percentage' | 'fixed',
        value: Number(form.value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : undefined,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
        expires_at: form.ends_at || '',
      });
      toast.success('Coupon mis à jour');
      setEditingId(null);
      resetForm();
      fetchCoupons();
    } catch { toast.error('Erreur'); }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Supprimer le coupon "${code}" ?`)) return;
    try { await deleteCoupon(id); toast.success('Supprimé'); fetchCoupons(); } catch { toast.error('Erreur'); }
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      code: c.code, type: c.type, value: String(c.value),
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : '',
      usage_limit: c.usage_limit ? String(c.usage_limit) : '',
      ends_at: c.ends_at ? c.ends_at.split('T')[0] : '',
    });
  };

  const formRow = (onSave: () => void, onCancel: () => void) => (
    <tr className="border-b border-gray-100 bg-gold/5">
      <td className="px-3 py-2"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CODE" className="w-full px-2 py-1 border rounded text-sm uppercase" /></td>
      <td className="px-3 py-2">
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-2 py-1 border rounded text-sm">
          <option value="percentage">%</option>
          <option value="fixed">DA fixe</option>
        </select>
      </td>
      <td className="px-3 py-2"><input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="10" className="w-20 px-2 py-1 border rounded text-sm" /></td>
      <td className="px-3 py-2"><input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} placeholder="0" className="w-20 px-2 py-1 border rounded text-sm" /></td>
      <td className="px-3 py-2"><input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="∞" className="w-16 px-2 py-1 border rounded text-sm" /></td>
      <td className="px-3 py-2"><input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className="px-2 py-1 border rounded text-sm" /></td>
      <td className="px-3 py-2 text-right">
        <button onClick={onSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
        <button onClick={onCancel} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{coupons.length} coupon(s)</p>
        <Button size="sm" onClick={() => { setIsAdding(true); resetForm(); }}><Plus size={16} /> Ajouter</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-3 py-3 font-medium text-gray-500">Code</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-500">Valeur</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-500">Min.</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-500">Limite</th>
                  <th className="text-left px-3 py-3 font-medium text-gray-500">Expire</th>
                  <th className="text-right px-3 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && formRow(handleCreate, () => setIsAdding(false))}
                {coupons.map((c) => (
                  editingId === c.id ? (
                    <React.Fragment key={c.id}>{formRow(handleUpdate, () => setEditingId(null))}</React.Fragment>
                  ) : (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-dark">{c.code}</span>
                          <button
                            onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Code copié !'); }}
                            className="p-1 text-gray-400 hover:text-gold transition-colors"
                            title="Copier le code"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-500">{c.type === 'percentage' ? '%' : 'DA'}</td>
                      <td className="px-3 py-3">{c.value}{c.type === 'percentage' ? '%' : ' DA'}</td>
                      <td className="px-3 py-3 text-gray-500">{c.min_order_amount || '—'}</td>
                      <td className="px-3 py-3 text-gray-500">{c.used_count || 0}/{c.usage_limit || '∞'}</td>
                      <td className="px-3 py-3 text-gray-500">{c.ends_at ? new Date(c.ends_at).toLocaleDateString('fr-FR') : '—'}</td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => startEdit(c)} className="p-1.5 text-gray-400 hover:text-gold"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(c.id, c.code)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  )
                ))}
                {!isAdding && coupons.length === 0 && (
                  <tr><td colSpan={7} className="p-12 text-center text-gray-400"><Ticket size={40} className="mx-auto mb-3 opacity-50" /><p>Aucun coupon</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
