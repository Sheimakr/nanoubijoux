'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, FileText, Check, X, Upload, Search } from 'lucide-react';
import { getAllBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, uploadProductImage } from '@/lib/supabase/admin-queries';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title_fr: '', content_fr: '', slug: '', featured_image: '',
  });

  const fetchPosts = async () => {
    setLoading(true);
    try { setPosts(await getAllBlogPosts()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const resetForm = () => setForm({ title_fr: '', content_fr: '', slug: '', featured_image: '' });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setForm(prev => ({ ...prev, featured_image: url }));
      toast.success('Image uploadée');
    } catch {
      toast.error("Erreur d'upload");
    }
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!form.title_fr) { toast.error('Le titre est obligatoire'); return; }
    try {
      await createBlogPost({
        title_fr: form.title_fr,
        content_fr: form.content_fr || '',
        slug: form.slug || slugify(form.title_fr),
        featured_image: form.featured_image || null,
        published_at: new Date().toISOString(),
      });
      toast.success('Article publié');
      setIsAdding(false);
      resetForm();
      fetchPosts();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.message || 'Erreur';
      toast.error(String(msg));
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await updateBlogPost(editingId, {
        title_fr: form.title_fr,
        content_fr: form.content_fr,
        slug: form.slug,
        featured_image: form.featured_image || null,
      });
      toast.success('Article mis à jour');
      setEditingId(null);
      resetForm();
      fetchPosts();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.message || 'Erreur';
      toast.error(String(msg));
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    try { await deleteBlogPost(id); toast.success('Supprimé'); fetchPosts(); } catch { toast.error('Erreur'); }
  };

  const startEdit = (p: Record<string, unknown>) => {
    setEditingId(p.id as string);
    setIsAdding(false);
    setForm({
      title_fr: (p.title_fr as string) || '',
      content_fr: (p.content_fr as string) || '',
      slug: (p.slug as string) || '',
      featured_image: (p.featured_image as string) || '',
    });
  };

  const filtered = search
    ? posts.filter(p => ((p.title_fr as string) || '').toLowerCase().includes(search.toLowerCase()))
    : posts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <Button size="sm" onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}><Plus size={16} /> Nouvel article</Button>
      </div>

      {/* Add/Edit form */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-dark">{isAdding ? 'Nouvel article' : "Modifier l'article"}</h3>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Titre *</label>
            <input value={form.title_fr} onChange={(e) => setForm({ ...form, title_fr: e.target.value, slug: isAdding ? slugify(e.target.value) : form.slug })} className="w-full px-3 py-2 border rounded-lg text-sm" autoFocus />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Contenu</label>
            <textarea value={form.content_fr} onChange={(e) => setForm({ ...form, content_fr: e.target.value })} rows={8} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Slug</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm text-gray-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Image</label>
            {form.featured_image ? (
              <div className="relative inline-block">
                <img src={form.featured_image} alt="Preview" className="w-40 h-24 object-cover rounded-lg border" />
                <button type="button" onClick={() => setForm({ ...form, featured_image: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors">
                <Upload size={20} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">{uploading ? 'Upload...' : 'Cliquer pour ajouter'}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={isAdding ? handleCreate : handleUpdate}>
              <Check size={16} /> {isAdding ? 'Publier' : 'Enregistrer'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Posts list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-50" />
            <p>{search ? 'Aucun résultat' : 'Aucun article'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Image</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Titre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id as string} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {post.featured_image ? (
                      <img src={post.featured_image as string} alt="" className="w-12 h-8 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center"><FileText size={14} className="text-gray-300" /></div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-dark">{post.title_fr as string}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {post.published_at ? new Date(post.published_at as string).toLocaleDateString('fr-FR') : 'Brouillon'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(post)} className="p-1.5 text-gray-400 hover:text-gold"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(post.id as string, post.title_fr as string)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
