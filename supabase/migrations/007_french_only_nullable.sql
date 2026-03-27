-- ============================================================
-- Migration 007: Make AR/EN columns nullable for French-only admin
-- ============================================================

-- Products: name_ar and name_en now optional
ALTER TABLE products ALTER COLUMN name_ar DROP NOT NULL;
ALTER TABLE products ALTER COLUMN name_ar SET DEFAULT '';
ALTER TABLE products ALTER COLUMN name_en DROP NOT NULL;
ALTER TABLE products ALTER COLUMN name_en SET DEFAULT '';
ALTER TABLE products ALTER COLUMN sku DROP NOT NULL;
ALTER TABLE products ALTER COLUMN sku SET DEFAULT '';

-- Categories: name_ar and name_en now optional
ALTER TABLE categories ALTER COLUMN name_ar DROP NOT NULL;
ALTER TABLE categories ALTER COLUMN name_ar SET DEFAULT '';
ALTER TABLE categories ALTER COLUMN name_en DROP NOT NULL;
ALTER TABLE categories ALTER COLUMN name_en SET DEFAULT '';

-- Blog posts: title_ar and title_en now optional
ALTER TABLE blog_posts ALTER COLUMN title_ar DROP NOT NULL;
ALTER TABLE blog_posts ALTER COLUMN title_ar SET DEFAULT '';
ALTER TABLE blog_posts ALTER COLUMN title_en DROP NOT NULL;
ALTER TABLE blog_posts ALTER COLUMN title_en SET DEFAULT '';
