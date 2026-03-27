-- ============================================================
-- Migration 007: Fix user_profiles infinite recursion RLS
-- ============================================================
-- The "Admins can read all profiles" policy causes infinite recursion
-- because it queries user_profiles to check if user is admin.
-- We already have "Allow read all user_profiles" which is simpler.

DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Ensure the open read policy exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_profiles'
    AND policyname = 'Allow read all user_profiles'
  ) THEN
    CREATE POLICY "Allow read all user_profiles" ON user_profiles FOR SELECT USING (true);
  END IF;
END $$;
