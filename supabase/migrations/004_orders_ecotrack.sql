-- ============================================================
-- Migration 004: Extend Orders for EcoTrack
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS ecotrack_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ecotrack_tracking text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ecotrack_label_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'home';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commune text;
