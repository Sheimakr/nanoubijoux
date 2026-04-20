'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Gem } from 'lucide-react';
import {
  getAllMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '@/lib/supabase/admin-queries';
import { getErrorMessage } from '@/lib/error-utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Material } from '@/types';

/**
 * Material (Matière) CRUD — mirrors the brands page pattern:
 *   - Inline "new row" at the top of the table
 *   - Row-level inline edit for name / slug
 *   - Hard delete (no soft-delete column on the materials table)
 *
 * Schema (see phase-4e-wiring migration): { id, name, slug }
 * Products optionally reference materials via products.material_id FK.
 */
export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', slug: '' });

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await getAllMaterials();
      setMaterials(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // ASCII-safe slug — matches categories/brands helper.
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const startEdit = (m: Material) => {
    setEditingId(m.id);
    setEditForm({ name: m.name, slug: m.slug });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateMaterial(editingId, {
        name: editForm.name,
        slug: editForm.slug || slugify(editForm.name),
      });
      toast.success('Matière mise à jour');
      setEditingId(null);
      fetchMaterials();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.message || 'Erreur';
      toast.error(String(msg));
    }
  };

  const handleCreate = async () => {
    if (!newForm.name) return;
    try {
      await createMaterial({
        name: newForm.name,
        slug: newForm.slug || slugify(newForm.name),
      });
      toast.success('Matière créée');
      setIsAdding(false);
      setNewForm({ name: '', slug: '' });
      fetchMaterials();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.message || 'Erreur';
      toast.error(String(msg));
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer la matière "${name}" ?`)) return;
    try {
      await deleteMaterial(id);
      toast.success('Matière supprimée');
      fetchMaterials();
    } catch {
      // FK SET NULL is set on products.material_id, so delete should succeed
      // even if products reference this material — they'll just lose the link.
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{materials.length} matière(s)</p>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          <Plus size={16} /> Ajouter
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : materials.length === 0 && !isAdding ? (
          <div className="p-12 text-center text-gray-400">
            <Gem size={40} className="mx-auto mb-3 opacity-50" />
            <p>Aucune matière</p>
            <p className="text-xs mt-1">Exemples : Or 18k, Argent 925, Platine, Acier inoxydable</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Inline new row */}
              {isAdding && (
                <tr className="border-b border-gray-100 bg-gold/5">
                  <td className="px-4 py-2">
                    <input
                      value={newForm.name}
                      onChange={(e) =>
                        setNewForm({
                          ...newForm,
                          name: e.target.value,
                          slug: slugify(e.target.value),
                        })
                      }
                      placeholder="ex. Or 18k"
                      className="w-full px-2 py-1 border rounded text-sm"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={newForm.slug}
                      onChange={(e) =>
                        setNewForm({ ...newForm, slug: e.target.value })
                      }
                      className="w-full px-2 py-1 border rounded text-sm text-gray-400"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={handleCreate}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewForm({ name: '', slug: '' });
                      }}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              )}

              {materials.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  {editingId === m.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={editForm.slug}
                          onChange={(e) =>
                            setEditForm({ ...editForm, slug: e.target.value })
                          }
                          className="w-full px-2 py-1 border rounded text-sm text-gray-400"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={handleUpdate}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        >
                          <X size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-dark">{m.name}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{m.slug}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => startEdit(m)}
                          className="p-1.5 text-gray-400 hover:text-gold"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id, m.name)}
                          className="p-1.5 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
