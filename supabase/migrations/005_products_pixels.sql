-- ============================================================
-- Migration 005: Products Pixel Assignment
-- ============================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS selected_pixel_ids text[] DEFAULT '{}';
