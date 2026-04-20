'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Upload, Tag } from 'lucide-react';
import { getBrands } from '@/lib/supabase/queries';
import {
  createBrand,
  updateBrand,
  deleteBrand,
  uploadProductImage,
} from '@/lib/supabase/admin-queries';
import { getErrorMessage } from '@/lib/error-utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Brand } from '@/types';

/**
 * Brand (Marque) CRUD — mirrors the categories page pattern so admins have
 * a consistent mental model:
 *   - Inline "new row" at the top of the table for fast creation
 *   - Row-level inline edit for name / slug / logo
 *   - Soft confirm → hard delete (brands table isn't soft-deleted server-side)
 *
 * Brand shape (src/types/index.ts:17): { id, name, slug, logo_url, sort_order }
 */
export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', logo_url: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', slug: '', logo_url: '' });

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const data = await getBrands();
      setBrands(data as Brand[]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // ASCII-safe slug helper — same rule as categories page.
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const startEdit = (b: Brand) => {
    setEditingId(b.id);
    setEditForm({
      name: b.name,
      slug: b.slug,
      logo_url: b.logo_url || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateBrand(editingId, {
        name: editForm.name,
        slug: editForm.slug || slugify(editForm.name),
        logo_url: editForm.logo_url || null,
      } as Partial<Brand>);
      toast.success('Marque mise à jour');
      setEditingId(null);
      fetchBrands();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.message || 'Erreur';
      toast.error(String(msg));
    }
  };

  const handleCreate = async () => {
    if (!newForm.name) return;
    try {
      await createBrand({
        name: newForm.name,
        slug: newForm.slug || slugify(newForm.name),
        logo_url: newForm.logo_url || null,
      } as Partial<Brand>);
      toast.success('Marque créée');
      setIsAdding(false);
      setNewForm({ name: '', slug: '', logo_url: '' });
      fetchBrands();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.message || 'Erreur';
      toast.error(String(msg));
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer la marque "${name}" ?`)) return;
    try {
      await deleteBrand(id);
      toast.success('Marque supprimée');
      fetchBrands();
    } catch {
      // Most common cause: products still reference this brand (FK constraint).
      toast.error('Erreur — des produits utilisent peut-être cette marque');
    }
  };

  const handleImageUpload = async (file: File, target: 'new' | 'edit') => {
    try {
      const url = await uploadProductImage(file);
      if (target === 'new') setNewForm((prev) => ({ ...prev, logo_url: url }));
      else setEditForm((prev) => ({ ...prev, logo_url: url }));
      toast.success('Logo uploadé');
    } catch {
      toast.error("Erreur d'upload");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{brands.length} marque(s)</p>
        <Button size="sm" onClick={() => setIsAdding(true)}>
          <Plus size={16} /> Ajouter
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : brands.length === 0 && !isAdding ? (
          <div className="p-12 text-center text-gray-400">
            <Tag size={40} className="mx-auto mb-3 opacity-50" />
            <p>Aucune marque</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Logo
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Nom
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  Slug
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* New row — inline creation at top of table */}
              {isAdding && (
                <tr className="border-b border-gray-100 bg-gold/5">
                  <td className="px-4 py-2">
                    {newForm.logo_url ? (
                      <img
                        src={newForm.logo_url}
                        alt=""
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <label className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded cursor-pointer hover:bg-gray-200">
                        <Upload size={14} className="text-gray-400" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleImageUpload(f, 'new');
                          }}
                        />
                      </label>
                    )}
                  </td>
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
                      placeholder="Nom de la marque"
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
                        setNewForm({ name: '', slug: '', logo_url: '' });
                      }}
                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                    >
                      <X size={16} />
                    </button>
                  </td>
                </tr>
              )}

              {brands.map((brand) => (
                <tr
                  key={brand.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  {editingId === brand.id ? (
                    <>
                      <td className="px-4 py-2">
                        {editForm.logo_url ? (
                          <div className="relative">
                            <img
                              src={editForm.logo_url}
                              alt=""
                              className="w-10 h-10 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEditForm({ ...editForm, logo_url: '' })
                              }
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ) : (
                          <label className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded cursor-pointer hover:bg-gray-200">
                            <Upload size={14} className="text-gray-400" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleImageUpload(f, 'edit');
                              }}
                            />
                          </label>
                        )}
                      </td>
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
                      <td className="px-4 py-3">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <Tag size={16} className="text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-dark">
                        {brand.name}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {brand.slug}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => startEdit(brand)}
                          className="p-1.5 text-gray-400 hover:text-gold"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id, brand.name)}
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
