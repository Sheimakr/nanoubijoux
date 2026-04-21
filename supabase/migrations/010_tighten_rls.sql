-- =====================================================================
-- 010_tighten_rls.sql
-- First-pass RLS hardening. Closes the critical holes where sensitive
-- admin / session / audit tables were readable by the anon key.
--
-- Safe to re-run — every policy uses DROP POLICY IF EXISTS then CREATE.
--
-- Tables hardened:
--   - admin_users      → no anon access (service-role only)
--   - admin_sessions   → no anon access
--   - order_history    → no anon access
--   - settings         → public SELECT kept; writes locked to service-role
--   - pixels           → SELECT scoped to active=true; writes locked
--
-- Tables intentionally LEFT open (documented as follow-up):
--   - products, categories, brands, materials, coupons, blog_posts,
--     orders, order_items, product_images.
--   The admin panel mutates these via the anon-key browser client
--   (src/lib/supabase/admin-queries.ts). Locking their write policies
--   would break admin CRUD until those pages are refactored to call
--   /api/admin/* routes backed by the service-role client.
--
-- Service-role ALWAYS bypasses RLS — so admin API routes using
-- `adminSupabase` continue to work after this migration.
-- =====================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. admin_users — lock down entirely
--    Previous state: "anon_all_admin_users" policy allowed everything.
--    Anyone with the public anon key could read password_hash rows.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow read all admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow delete admin_users" ON admin_users;

-- No CREATE POLICY → zero access for anon/authenticated.
-- service_role bypasses RLS, so the admin-auth lib still reads/writes.

-- ─────────────────────────────────────────────────────────────────────
-- 2. admin_sessions — lock down entirely
--    Previous state: anon could list every active session token.
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_admin_sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Allow read all admin_sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Allow insert admin_sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Allow update admin_sessions" ON admin_sessions;
DROP POLICY IF EXISTS "Allow delete admin_sessions" ON admin_sessions;

-- ─────────────────────────────────────────────────────────────────────
-- 3. order_history — lock down entirely (audit table, admin-only)
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_order_history" ON order_history;
DROP POLICY IF EXISTS "Allow read all order_history" ON order_history;
DROP POLICY IF EXISTS "Allow insert order_history" ON order_history;

-- ─────────────────────────────────────────────────────────────────────
-- 4. settings — keep public SELECT, lock writes
--    Storefront reads store_name / phone / socials via anon. Admin
--    writes go through /api/admin/settings (service-role).
-- ─────────────────────────────────────────────────────────────────────

-- Drop any old open write policies from earlier migrations / UI seeding
DROP POLICY IF EXISTS "anon_all_settings"        ON settings;
DROP POLICY IF EXISTS "Allow insert settings"    ON settings;
DROP POLICY IF EXISTS "Allow update settings"    ON settings;
DROP POLICY IF EXISTS "Allow delete settings"    ON settings;

-- Ensure the public_read policy is in place (may already exist)
DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings" ON settings
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────
-- 5. pixels — SELECT only for active rows, lock writes
-- ─────────────────────────────────────────────────────────────────────

ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_pixels"        ON pixels;
DROP POLICY IF EXISTS "Allow insert pixels"    ON pixels;
DROP POLICY IF EXISTS "Allow update pixels"    ON pixels;
DROP POLICY IF EXISTS "Allow delete pixels"    ON pixels;
DROP POLICY IF EXISTS "Allow read all pixels"  ON pixels;
DROP POLICY IF EXISTS "public_read_pixels"     ON pixels;

-- Only active pixels are exposed to the storefront to reduce surface.
CREATE POLICY "public_read_active_pixels" ON pixels
  FOR SELECT USING (active = true);

-- ─────────────────────────────────────────────────────────────────────
-- 6. Verify — expected result:
--    admin_users     → 0 rows (no policies)
--    admin_sessions  → 0 rows
--    order_history   → 0 rows
--    settings        → 1 row (public_read_settings SELECT)
--    pixels          → 1 row (public_read_active_pixels SELECT)
-- ─────────────────────────────────────────────────────────────────────

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'admin_sessions', 'order_history',
                    'settings', 'pixels')
ORDER BY tablename, cmd;

-- ─────────────────────────────────────────────────────────────────────
-- 7. Follow-up note (for a future migration 011):
--    Catalog tables (products / categories / brands / coupons / blog_posts
--    / product_images / orders.UPDATE+DELETE) still accept anon writes.
--    To fully close: refactor admin-queries.ts to call /api/admin/* API
--    routes backed by the service-role client, then DROP those write
--    policies. Estimated effort: ~2 hours.
-- ─────────────────────────────────────────────────────────────────────

COMMIT;
