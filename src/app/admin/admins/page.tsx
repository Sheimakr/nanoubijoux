'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Shield, Trash2, X, Eye, EyeOff, Pencil } from 'lucide-react';

/**
 * Admin user shape as returned by GET /api/admin/users.
 * The API still returns `role` and `permissions` for completeness, but
 * this page only surfaces role='admin' rows — agents / custom users are
 * out of scope for the "Admins" section per the latest UX decision.
 */
interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'agent' | 'custom';
  permissions: string[];
  active: boolean;
  createdAt: string;
}

/**
 * Combined create + edit form state. When `id` is present we're editing
 * an existing record; otherwise we're creating. Password is required on
 * create, optional on edit (empty string = keep current hash).
 *
 * `isSuperAdmin` maps to backend role:
 *   true  → role='admin'  (full access, all permissions granted implicitly)
 *   false → role='agent'  (limited — default to orders view/edit permissions)
 */
interface FormState {
  id?: string;
  username: string;
  password: string;
  displayName: string;
  isSuperAdmin: boolean;
}

const EMPTY_FORM: FormState = {
  username: '',
  password: '',
  displayName: '',
  isSuperAdmin: true, // Creating super-admin by default is the common case.
};

// Default permission set for non-super-admins (role='agent').
const AGENT_DEFAULT_PERMISSIONS = ['orders:view', 'orders:edit'];

export default function AdminsPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!form.id;

  /**
   * Fetch admin users, hiding soft-deleted (inactive) rows so the delete
   * button actually looks like it works. Backend DELETE is a soft-delete
   * (sets active=false), so filtering here is what makes the row vanish.
   */
  const load = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      const admins = ((data.users ?? []) as AdminUser[]).filter(
        (u) => u.active !== false,
      );
      setUsers(admins);
    } catch (err) {
      console.error('[Admins] load failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError('');
    setShowPassword(false);
    setShowForm(true);
  };

  const openEdit = (user: AdminUser) => {
    setForm({
      id: user.id,
      username: user.username,
      password: '',
      displayName: user.displayName,
      // Derive the checkbox from the row's role.
      isSuperAdmin: user.role === 'admin',
    });
    setError('');
    setShowPassword(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setError('');
    setForm(EMPTY_FORM);
  };

  /** Save handles both POST (create) and PATCH (edit). */
  const save = async () => {
    // --- Validation --------------------------------------------------
    if (!isEditMode) {
      if (!form.username || form.username.length < 3) {
        setError('Nom d\'utilisateur : 3 caractères minimum');
        return;
      }
      if (!form.password || form.password.length < 6) {
        setError('Mot de passe : 6 caractères minimum');
        return;
      }
    } else if (form.password && form.password.length < 6) {
      // Password is optional on edit, but if provided must be >= 6 chars.
      setError('Mot de passe : 6 caractères minimum');
      return;
    }

    setError('');
    setSaving(true);

    let res: Response;
    try {
      // Derive backend role + permissions from the Super-Admin checkbox.
      // Super-admin → role='admin' (all access). Otherwise → 'agent' with
      // a sensible default permission set the admin can refine via SQL.
      const role = form.isSuperAdmin ? 'admin' : 'agent';
      const permissions = form.isSuperAdmin ? [] : AGENT_DEFAULT_PERMISSIONS;

      if (isEditMode) {
        // PATCH — send editable fields including role (promotion / demotion).
        const payload: Record<string, unknown> = {
          displayName: form.displayName,
          role,
          permissions,
        };
        if (form.password) payload.password = form.password;

        res = await fetch(`/api/admin/users/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // POST — role + permissions driven by the checkbox above.
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: form.username,
            password: form.password,
            displayName: form.displayName || form.username,
            role,
            permissions,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de l\'enregistrement');
        return;
      }

      closeForm();
      await load();
    } finally {
      setSaving(false);
    }
  };

  /** Activate / deactivate an admin. Backend blocks self-deactivation. */
  const toggleActive = async (user: AdminUser) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Erreur');
      return;
    }
    await load();
  };

  /** Delete (backend does soft-delete — admin stays in DB marked inactive). */
  const remove = async (user: AdminUser) => {
    if (!confirm(`Supprimer l'admin "${user.displayName || user.username}" ?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Erreur');
      return;
    }
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
          <p className="text-sm text-gray-500">
            Gérez les comptes administrateurs du panneau
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Plus size={16} /> Ajouter un admin
        </button>
      </div>

      {/* Create / edit form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Shield size={18} className="text-amber-600" />
              {isEditMode ? 'Modifier l\'admin' : 'Nouvel admin'}
            </h2>
            <button
              onClick={closeForm}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Username — immutable after creation (it's the lookup key). */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Nom d&apos;utilisateur
              </label>
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                disabled={isEditMode}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
              />
              {isEditMode && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Le nom d&apos;utilisateur ne peut pas être modifié
                </p>
              )}
            </div>

            {/* Display name */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Nom affiché
              </label>
              <input
                value={form.displayName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, displayName: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none"
              />
            </div>

            {/* Password */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Mot de passe
                {isEditMode && (
                  <span className="text-gray-400 font-normal">
                    {' '}
                    (laisser vide pour garder l&apos;actuel)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 outline-none pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Super-Admin toggle — the backend maps this to role='admin'
                (full access) vs role='agent' (limited). */}
            <div className="md:col-span-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={form.isSuperAdmin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isSuperAdmin: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Super Admin
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {form.isSuperAdmin
                      ? 'Accès complet au panneau d\'administration (tous les droits).'
                      : 'Accès limité : consultation et modification des commandes uniquement.'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={closeForm}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
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
              {isEditMode ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400">
          <Shield size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Aucun admin pour le moment</p>
          <p className="text-sm mt-1">
            Cliquez sur « Ajouter un admin » pour créer le premier compte.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 rounded-xl border bg-white p-4 ${
                user.active ? 'border-gray-200' : 'border-gray-100 opacity-50'
              }`}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm bg-amber-100 text-amber-700">
                {user.displayName?.charAt(0)?.toUpperCase() ||
                  user.username.charAt(0).toUpperCase()}
              </div>

              {/* Info — role badge differentiates super admin vs agent */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {user.displayName || user.username}
                  </span>
                  {user.role === 'admin' ? (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700">
                      Super Admin
                    </span>
                  ) : (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">
                      {user.role}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">@{user.username}</div>
              </div>

              {/* Actions */}
              <button
                onClick={() => openEdit(user)}
                className="p-2 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50"
                title="Modifier"
                aria-label="Modifier"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => toggleActive(user)}
                className="p-2 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50"
                title={user.active ? 'Désactiver' : 'Activer'}
                aria-label={user.active ? 'Désactiver' : 'Activer'}
              >
                <Shield size={18} />
              </button>
              <button
                onClick={() => remove(user)}
                className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"
                title="Supprimer"
                aria-label="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
