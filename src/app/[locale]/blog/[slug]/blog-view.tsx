'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getLocalizedField } from '@/lib/utils';

// Optional *_ar / *_en fields — the DB always has *_fr populated and
// the other locales are filled in as translators catch up.
interface BlogPost {
  id: string;
  title_fr: string;
  title_ar?: string;
  title_en?: string;
  content_fr: string;
  content_ar?: string;
  content_en?: string;
  slug: string;
  featured_image: string | null;
  published_at: string;
}

export default function BlogPostPage() {
  const params = useParams();
  const locale = useLocale();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();

    // async IIFE — Supabase's PostgrestFilterBuilder is thenable but its
    // type resolves to PromiseLike<void> when you chain .then(), which
    // under Next 16's strict tsc doesn't expose `.finally`. await works.
    (async () => {
      try {
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .not('published_at', 'is', null)
          .single();

        setPost(data);

        if (data) {
          const { data: rel } = await supabase
            .from('blog_posts')
            .select('*')
            .not('published_at', 'is', null)
            .neq('id', data.id)
            .order('published_at', { ascending: false })
            .limit(2);
          setRelated(rel || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-text-body">Article introuvable.</p>
        <Link href="/blog" className="text-gold hover:underline text-sm flex items-center gap-1">
          <ArrowLeft size={14} /> Retour au blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero image — priority because it's above the fold on this page */}
      {post.featured_image && (
        <div className="relative w-full h-64 sm:h-96 bg-cream">
          <Image
            src={post.featured_image}
            alt={getLocalizedField(post, 'title', locale)}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-text-body hover:text-gold mb-6">
          <ArrowLeft size={14} /> Retour au blog
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Calendar size={14} />
            {formatDate(post.published_at)}
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-dark mb-8 leading-snug">
            {getLocalizedField(post, 'title', locale)}
          </h1>
        </motion.div>

        {/* Content — renders the locale-specific column (falls back to FR) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="prose prose-gray max-w-none text-charcoal leading-relaxed"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {getLocalizedField(post, 'content', locale)}
        </motion.div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border">
            <h2 className="font-heading text-xl font-semibold text-dark mb-6">Articles similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {related.map((r) => {
                const relatedTitle = getLocalizedField(r, 'title', locale);
                return (
                  <Link key={r.id} href={`/blog/${r.slug}`} className="group block">
                    <div className="aspect-[16/9] overflow-hidden bg-cream relative rounded mb-3">
                      {r.featured_image ? (
                        <Image
                          src={r.featured_image}
                          alt={relatedTitle}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-cream flex items-center justify-center text-3xl">📝</div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{formatDate(r.published_at)}</p>
                    <h3 className="font-heading font-semibold text-dark group-hover:text-gold transition-colors text-sm line-clamp-2">
                      {relatedTitle}
                    </h3>
                    <span className="text-xs text-gold flex items-center gap-1 mt-1">
                      Lire la suite <ArrowRight size={12} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
