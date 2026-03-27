-- ============================================================
-- Migration 006: Wilayas Extended Delivery Pricing
-- ============================================================

ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS desk_fee numeric DEFAULT 0;
ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS free_from numeric DEFAULT 0;
ALTER TABLE wilayas ADD COLUMN IF NOT EXISTS home_fee numeric;

-- Copy existing shipping_fee to home_fee for backward compatibility
UPDATE wilayas SET home_fee = shipping_fee WHERE home_fee IS NULL;
