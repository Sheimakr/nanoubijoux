'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { getCategories, getBrands } from '@/lib/supabase/queries';
import { createProduct, addProductImage, uploadProductImage } from '@/lib/supabase/admin-queries';
import { Button } from '@/components/ui/button';
import { slugify } from '@/lib/utils';
import { toast } from 'sonner';
import type { Category, Brand } from '@/types';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name_fr: '',
    description_fr: '',
    slug: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    brand_id: '',
    material: '',
    stock_quantity: '50',
    sku: '',
    is_featured: false,
    is_new: true,
    is_on_sale: false,
    image_url: '',
  });

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
    getBrands().then(setBrands).catch(console.error);
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setForm(prev => ({ ...prev, image_url: url }));
      toast.success('Image uploadée !');
    } catch {
      toast.error("Erreur lors de l'upload");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_fr || !form.price) {
      toast.error('Nom et prix sont obligatoires');
      return;
    }

    setSaving(true);
    try {
      const product = await createProduct({
        name_fr: form.name_fr,
        description_fr: form.description_fr || null,
        slug: form.slug || slugify(form.name_fr),
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        category_id: form.category_id ? Number(form.category_id) : null,
        brand_id: form.brand_id ? Number(form.brand_id) : null,
        material: form.material || null,
        stock_quantity: Number(form.stock_quantity),
        sku: form.sku || `P${Date.now().toString(36).toUpperCase()}`,
        is_featured: form.is_featured,
        is_new: form.is_new,
        is_on_sale: form.is_on_sale,
      } as any);

      if (form.image_url && product.id) {
        await addProductImage(product.id, form.image_url, true);
      }

      toast.success('Produit créé !');
      router.push('/admin/produits');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as Record<string, unknown>)?.message || JSON.stringify(err);
      console.error('Create product error:', msg, err);
      toast.error(msg ? `Erreur: ${msg}` : 'Erreur lors de la création');
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl">
      <Link href="/admin/produits" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gold mb-6">
        <ArrowLeft size={16} /> Retour aux produits
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name & Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-heading font-semibold text-dark">Informations</h2>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nom du produit *</label>
            <input value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value, slug: slugify(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm focus:border-gold focus:outline-none" required />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Description</label>
            <textarea value={form.description_fr} onChange={(e) => setForm({ ...form, description_fr: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="P012345" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        </div>

        {/* Price & Stock */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-heading font-semibold text-dark">Prix & Stock</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Prix (DA) *</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ancien prix (DA)</label>
              <input type="number" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Stock</label>
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
        </div>

        {/* Category, Brand, Material */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-heading font-semibold text-dark">Classification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Catégorie</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">— Aucune —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_fr}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Marque</label>
              <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">— Aucune —</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Matériau</label>
              <select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">— Aucun —</option>
                <option value="Acier inoxydable">Acier inoxydable</option>
                <option value="Plaqué or">Plaqué or</option>
                <option value="Argent 925">Argent 925</option>
                <option value="Cuivre">Cuivre</option>
                <option value="Perles">Perles</option>
              </select>
            </div>
          </div>
        </div>

        {/* Image — file upload only */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-heading font-semibold text-dark">Image</h2>
          {form.image_url ? (
            <div className="relative inline-block">
              <img src={form.image_url} alt="Preview" className="w-40 h-40 object-cover rounded-lg border" />
              <button
                type="button"
                onClick={() => setForm({ ...form, image_url: '' })}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">{uploading ? 'Upload en cours...' : 'Cliquer pour ajouter une image'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </label>
          )}
        </div>

        {/* Flags */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-heading font-semibold text-dark">Options</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="w-4 h-4 text-gold rounded" />
              <span className="text-sm">Produit vedette</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="w-4 h-4 text-gold rounded" />
              <span className="text-sm">Nouveau</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_on_sale} onChange={(e) => setForm({ ...form, is_on_sale: e.target.checked })} className="w-4 h-4 text-gold rounded" />
              <span className="text-sm">En promotion</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            <Save size={16} /> {saving ? 'Enregistrement...' : 'Créer le produit'}
          </Button>
          <Link href="/admin/produits">
            <Button type="button" variant="outline">Annuler</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
