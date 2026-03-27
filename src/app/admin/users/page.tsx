'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Shield, Trash2, X, Eye, EyeOff } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'agent' | 'custom';
  permissions: string[];
  active: boolean;
  createdAt: string;
}

const ALL_PERMISSIONS = [
  { key: 'orders:view', label: 'Voir les commandes' },
  { key: 'orders:edit', label: 'Modifier les commandes' },
  { key: 'orders:delete', label: 'Supprimer les commandes' },
  { key: 'orders:ship', label: 'Expédier les commandes' },
  { key: 'products:manage', label: 'Gérer les produits' },
  { key: 'categories:manage', label: 'Gérer les catégories' },
  { key: 'pixels:manage', label: 'Gérer les pixels' },
  { key: 'delivery:manage', label: 'Gérer la livraison' },
  { key: 'settings:manage', label: 'Gérer les paramètres' },
  { key: 'users:manage', label: 'Gérer les utilisateurs' },
  { key: 'reports:view', label: 'Voir les rapports' },
];

const EMPTY_FORM: { username: string; password: string; displayName: string; role: AdminUser['role']; permissions: string[] } = { username: '', password: '', displayName: '', role: 'agent', permissions: ['orders:view', 'orders:edit'] };

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.username || form.username.length < 3) { setError('3 caractères minimum pour le nom'); return; }
    if (!form.password || form.password.length < 6) { setError('6 caractères minimum pour le mot de passe'); return; }
    setError('');
    setSaving(true);

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Erreur');
      setSaving(false);
      return;
    }

    setForm(EMPTY_FORM);
    setShowForm(false);
    await load();
    setSaving(false);
  };

  const toggleActive = async (user: AdminUser) => {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Désactiver cet utilisateur ?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    await load();
  };

  const togglePermission = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500">Gérez les accès au panneau d&apos;administration</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900"><Shield size={18} className="text-amber-600" /> Nouvel utilisateur</h2>
            <button onClick={() => { setShowForm(false); setError(''); }} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom d&apos;utilisateur</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nom affiché</label>
              <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mot de passe</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Rôle</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof f.role }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none">
                <option value="admin">Admin (tous les accès)</option>
                <option value="agent">Agent (commandes)</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>
          </div>

          {form.role === 'custom' && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-500 mb-2">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ALL_PERMISSIONS.map(p => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePermission(p.key)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-amber-400">
              {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Save size={16} />}
              Créer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-gray-400">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className={`flex items-center gap-4 rounded-xl border bg-white p-4 ${user.active ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : user.role === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                {user.displayName?.charAt(0)?.toUpperCase() || user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{user.displayName || user.username}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' : user.role === 'agent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.role}
                  </span>
                  {!user.active && <span className="rounded-full px-2 py-0.5 text-[10px] bg-red-100 text-red-600">Désactivé</span>}
                </div>
                <div className="text-xs text-gray-400">@{user.username}</div>
              </div>
              <button onClick={() => toggleActive(user)} className="p-2 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50" title={user.active ? 'Désactiver' : 'Activer'}>
                <Shield size={18} />
              </button>
              <button onClick={() => remove(user.id)} className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
