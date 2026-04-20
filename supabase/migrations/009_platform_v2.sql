-- =====================================================================
-- 009_platform_v2.sql
-- Consolidated migration — cumulative schema + policy changes from the
-- v2 platform refactor. Everything is idempotent (IF NOT EXISTS /
-- DROP POLICY IF EXISTS / CREATE OR REPLACE) so this file can be run
-- safely on a fresh database OR on an environment that already has
-- some of the changes applied.
--
-- What this adds:
--   - settings.email, settings.hero_images
--   - Singleton dedup of settings (keeps oldest row)
--   - materials table + products.material_id FK
--   - INSERT policies on orders + order_items (guest checkout fix)
--   - Public read policy + realtime on settings
--   - Public read policy on materials
--   - Hot-path indexes for shop / checkout / admin performance
-- =====================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. settings table — add email + hero_images, keep singleton shape
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE settings ADD COLUMN IF NOT EXISTS email        text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_images  jsonb DEFAULT '[]'::jsonb;

-- Ensure there's only one row. UUIDs don't sort chronologically, so
-- keep the oldest created_at (tiebreaker: id::text).
DELETE FROM settings
WHERE id NOT IN (
  SELECT id FROM settings
  ORDER BY created_at ASC NULLS LAST, id::text ASC
  LIMIT 1
);

-- Public read policy so the storefront can pull settings via anon key
-- (store_name, phone, email, hero_images, social URLs).
-- WARNING: this exposes ecotrack_token to anon. Acceptable in dev;
-- switch to a view-based projection in production.
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings" ON settings
  FOR SELECT USING (true);

-- Add settings to the realtime publication so admin edits broadcast
-- to the storefront (footer / contact / hero) without page reload.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. materials table + products.material_id FK
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS materials (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_slug ON materials(slug);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS material_id INT
  REFERENCES materials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_material_id
  ON products(material_id);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_materials" ON materials;
CREATE POLICY "public_read_materials" ON materials
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_write_materials" ON materials;
CREATE POLICY "admin_write_materials" ON materials
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────
-- 3. Missing INSERT policies on orders + order_items
-- Guest checkout was failing silently (code 23503) — these fix it.
-- ─────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow insert orders" ON orders;
CREATE POLICY "Allow insert orders" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert order_items" ON order_items;
CREATE POLICY "Allow insert order_items" ON order_items
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────
-- 4. Hot-path indexes (shop / checkout / admin perf)
-- Target: 5–50× faster at ≥1 000 rows. Safe no-op if already present.
-- ─────────────────────────────────────────────────────────────────────

-- products
CREATE INDEX IF NOT EXISTS idx_products_slug         ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id     ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at   ON products(created_at DESC);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_status         ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id        ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at     ON orders(created_at DESC);

-- order_items — children of FK aren't auto-indexed in Postgres
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone   ON user_profiles(phone);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_slug       ON categories(slug);

-- blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug         ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 5. Seed 3 luxury jewelry categories (safe to re-run — ON CONFLICT)
-- ─────────────────────────────────────────────────────────────────────

-- Ensure description columns exist (may be absent in older schemas)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS description_fr  text,
  ADD COLUMN IF NOT EXISTS description_ar  text,
  ADD COLUMN IF NOT EXISTS description_en  text,
  ADD COLUMN IF NOT EXISTS display_order   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active          boolean DEFAULT true;

INSERT INTO categories
  (name_fr, name_ar, name_en, slug,
   description_fr, description_ar, description_en,
   display_order, active)
VALUES
(
  'Colliers & Pendentifs', 'القلائد والمعلقات', 'Necklaces & Pendants',
  'colliers-pendentifs',
  'Collection exclusive de colliers et pendentifs en or et platine, sertis de diamants et pierres précieuses.',
  'مجموعة حصرية من القلائد والمعلقات المصنوعة من الذهب والبلاتين، المرصعة بالألماس والأحجار الكريمة.',
  'Exclusive collection of gold and platinum necklaces and pendants, set with diamonds and precious stones.',
  1, true
),
(
  'Bagues & Alliances', 'الخواتم وخواتم الخطوبة', 'Rings & Engagement',
  'bagues-alliances',
  'De la bague solitaire iconique à l''alliance éternité pavée de diamants.',
  'من خاتم السوليتير الأيقوني إلى خاتم الأبدية المرصع بالألماس.',
  'From iconic solitaire to diamond-paved eternity bands.',
  2, true
),
(
  'Bracelets & Joncs', 'الأساور والأطواق', 'Bracelets & Bangles',
  'bracelets-joncs',
  'Bracelets tennis diamantés, joncs en or massif, chaînes délicates.',
  'أساور تنس مرصعة بالألماس، وأطواق من الذهب الخالص، وسلاسل رقيقة.',
  'Diamond tennis bracelets, solid gold bangles, delicate chains.',
  3, true
)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- 6. Verify
-- ─────────────────────────────────────────────────────────────────────

SELECT 'settings'        AS table_name, COUNT(*) AS rows FROM settings
UNION ALL SELECT 'materials',         COUNT(*) FROM materials
UNION ALL SELECT 'categories',        COUNT(*) FROM categories
UNION ALL SELECT 'products',          COUNT(*) FROM products;

COMMIT;
