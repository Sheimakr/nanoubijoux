'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Calendar, ArrowRight, Search } from 'lucide-react';
import { getPublishedBlogPosts } from '@/lib/supabase/queries';
import { getLocalizedField } from '@/lib/utils';
import Image from 'next/image';

/**
 * Row shape from the `blog_posts` table. We index signatures allow
 * getLocalizedField() to pick title_fr | title_ar | title_en and
 * content_fr | content_ar | content_en by locale at render time.
 */
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

export default function BlogPage() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublishedBlogPosts()
      .then((data) => setPosts(data as BlogPost[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Search filters against whichever locale the user is viewing — so
  // typing in Arabic searches title_ar/content_ar, etc.
  const filteredPosts = posts.filter((post) => {
    const title = getLocalizedField(post, 'title', locale).toLowerCase();
    const content = getLocalizedField(post, 'content', locale).toLowerCase();
    const q = searchQuery.toLowerCase();
    return title.includes(q) || content.includes(q);
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getExcerpt = (content: string, maxLen = 120) => {
    if (!content) return '';
    const stripped = content.replace(/<[^>]+>/g, '').replace(/\n+/g, ' ');
    return stripped.length > maxLen ? stripped.slice(0, maxLen) + '...' : stripped;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-cream border-b border-border py-10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-3xl sm:text-4xl font-bold text-dark"
          >
            {t('blog')}
          </motion.h1>
          <p className="text-text-body mt-2">Conseils, tendances et guides bijoux</p>

          <div className="relative mt-6 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full pl-10 pr-4 py-2.5 border border-border bg-white text-sm focus:border-gold focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-gray-200 mb-4 rounded" />
                <div className="h-4 w-24 bg-gray-200 mb-2 rounded" />
                <div className="h-5 w-full bg-gray-200 mb-2 rounded" />
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="aspect-[16/10] overflow-hidden bg-cream mb-4 relative rounded-lg">
                    {post.featured_image ? (
                      <Image
                        src={post.featured_image}
                        alt={getLocalizedField(post, 'title', locale)}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-cream flex items-center justify-center">
                        <span className="text-4xl">📝</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <Calendar size={14} />
                    {formatDate(post.published_at)}
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-dark group-hover:text-gold transition-colors mb-2">
                    {getLocalizedField(post, 'title', locale)}
                  </h2>
                  <p className="text-sm text-gray-500 mb-3">
                    {getExcerpt(getLocalizedField(post, 'content', locale))}
                  </p>
                  <span className="text-sm text-gold font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Lire la suite <ArrowRight size={14} />
                  </span>
                </Link>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {searchQuery ? (
              <p className="text-text-body">Aucun article trouvé pour &quot;{searchQuery}&quot;</p>
            ) : (
              <p className="text-text-body">Aucun article publié pour le moment.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
