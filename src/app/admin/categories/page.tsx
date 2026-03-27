'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Check, X, Upload, Package } from 'lucide-react';
import { getCategories } from '@/lib/supabase/queries';
import { createCategory, updateCategory, deleteCategory, uploadProductImage, getAdminProducts } from '@/lib/supabase/admin-queries';
import { getErrorMessage } from '@/lib/error-utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { Category } from '@/types';
import Link from 'next/link';

interface CategoryWithCount extends Category {
  productCount?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name_fr: '', slug: '', image_url: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ name_fr: '', slug: '', image_url: '' });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [catProducts, setCatProducts] = useState<Record<number, { name_fr: string; id: string; price: number }[]>>({});

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      // Fetch product counts per category
      const withCounts: CategoryWithCount[] = [];
      for (const cat of data) {
        try {
          const { total } = await getAdminProducts({ categoryId: cat.id, limit: 1 });
          withCounts.push({ ...cat, productCount: total });
        } catch {
          withCounts.push({ ...cat, productCount: 0 });
        }
      }
      setCategories(withCounts);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const startEdit = (cat: CategoryWithCount) => {
    setEditingId(cat.id);
    setEditForm({ name_fr: cat.name_fr, slug: cat.slug, image_url: cat.image_url || '' });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateCategory(editingId, {
        name_fr: editForm.name_fr,
        slug: editForm.slug || slugify(editForm.name_fr),
        image_url: editForm.image_url || null,
      } as Partial<Category>);
      toast.success('Catégorie mise à jour');
      setEditingId(null);
      fetchCategories();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.message || 'Erreur';
      toast.error(String(msg));
    }
  };

  const handleCreate = async () => {
    if (!newForm.name_fr) return;
    try {
      await createCategory({
        name_fr: newForm.name_fr,
        slug: newForm.slug || slugify(newForm.name_fr),
        image_url: newForm.image_url || null,
      } as Partial<Category>);
      toast.success('Catégorie créée');
      setIsAdding(false);
      setNewForm({ name_fr: '', slug: '', image_url: '' });
      fetchCategories();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.message || 'Erreur';
      toast.error(String(msg));
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    try {
      await deleteCategory(id);
      toast.success('Catégorie supprimée');
      fetchCategories();
    } catch {
      toast.error('Erreur — la catégorie contient peut-être des produits');
    }
  };

  const handleImageUpload = async (file: File, target: 'new' | 'edit') => {
    try {
      const url = await uploadProductImage(file);
      if (target === 'new') setNewForm(prev => ({ ...prev, image_url: url }));
      else setEditForm(prev => ({ ...prev, image_url: url }));
      toast.success('Image uploadée');
    } catch {
      toast.error("Erreur d'upload");
    }
  };

  const toggleProducts = async (catId: number) => {
    if (expandedId === catId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(catId);
    if (!catProducts[catId]) {
      try {
        const { products } = await getAdminProducts({ categoryId: catId, limit: 50 });
        setCatProducts(prev => ({ ...prev, [catId]: products.map((p: Record<string, unknown>) => ({ name_fr: p.name_fr as string, id: p.id as string, price: p.price as number })) }));
      } catch {
        setCatProducts(prev => ({ ...prev, [catId]: [] }));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{categories.length} catégorie(s)</p>
        <Button size="sm" onClick={() => setIsAdding(true)}><Plus size={16} /> Ajouter</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : categories.length === 0 && !isAdding ? (
          <div className="p-12 text-center text-gray-400">Aucune catégorie</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Image</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Produits</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* New row */}
              {isAdding && (
                <tr className="border-b border-gray-100 bg-gold/5">
                  <td className="px-4 py-2">
                    {newForm.image_url ? (
                      <img src={newForm.image_url} alt="" className="w-10 h-10 object-cover rounded" />
                    ) : (
                      <label className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded cursor-pointer hover:bg-gray-200">
                        <Upload size={14} className="text-gray-400" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'new'); }} />
                      </label>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <input value={newForm.name_fr} onChange={(e) => setNewForm({ ...newForm, name_fr: e.target.value, slug: slugify(e.target.value) })} placeholder="Nom de la catégorie" className="w-full px-2 py-1 border rounded text-sm" autoFocus />
                  </td>
                  <td className="px-4 py-2">
                    <input value={newForm.slug} onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })} className="w-full px-2 py-1 border rounded text-sm text-gray-400" />
                  </td>
                  <td className="px-4 py-2 text-center text-gray-400">—</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={handleCreate} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                    <button onClick={() => { setIsAdding(false); setNewForm({ name_fr: '', slug: '', image_url: '' }); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
                  </td>
                </tr>
              )}

              {categories.map((cat) => (
                <React.Fragment key={cat.id}>
                  <tr className="border-b border-gray-50 hover:bg-gray-50">
                    {editingId === cat.id ? (
                      <>
                        <td className="px-4 py-2">
                          {editForm.image_url ? (
                            <div className="relative">
                              <img src={editForm.image_url} alt="" className="w-10 h-10 object-cover rounded" />
                              <button type="button" onClick={() => setEditForm({ ...editForm, image_url: '' })} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10} /></button>
                            </div>
                          ) : (
                            <label className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded cursor-pointer hover:bg-gray-200">
                              <Upload size={14} className="text-gray-400" />
                              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'edit'); }} />
                            </label>
                          )}
                        </td>
                        <td className="px-4 py-2"><input value={editForm.name_fr} onChange={(e) => setEditForm({ ...editForm, name_fr: e.target.value })} className="w-full px-2 py-1 border rounded text-sm" /></td>
                        <td className="px-4 py-2"><input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} className="w-full px-2 py-1 border rounded text-sm text-gray-400" /></td>
                        <td className="px-4 py-2 text-center text-gray-400">{cat.productCount ?? 0}</td>
                        <td className="px-4 py-2 text-right">
                          <button onClick={handleUpdate} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X size={16} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name_fr} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><Package size={16} className="text-gray-300" /></div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-dark">{cat.name_fr}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{cat.slug}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleProducts(cat.id)} className="text-sm text-amber-600 hover:underline">
                            {cat.productCount ?? 0} produit(s)
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-gold"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(cat.id, cat.name_fr)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                  {/* Expanded products list */}
                  {expandedId === cat.id && (
                    <tr key={`${cat.id}-products`}>
                      <td colSpan={5} className="px-8 py-3 bg-gray-50">
                        {catProducts[cat.id]?.length ? (
                          <div className="space-y-1">
                            {catProducts[cat.id].map(p => (
                              <Link key={p.id} href={`/admin/produits/${p.id}`} className="flex justify-between items-center text-sm py-1 px-2 hover:bg-white rounded">
                                <span className="text-gray-700">{p.name_fr}</span>
                                <span className="text-gray-400">{p.price} DA</span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">Aucun produit dans cette catégorie</p>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
