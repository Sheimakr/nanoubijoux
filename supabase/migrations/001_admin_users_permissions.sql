-- ============================================================
-- Migration 001: Admin Users, Sessions & Order History
-- ============================================================

-- Admin users table (separate from Supabase Auth user_profiles)
CREATE TABLE IF NOT EXISTS admin_users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username      text NOT NULL,
    password_hash text NOT NULL,
    display_name  text NOT NULL DEFAULT '',
    role          text NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent', 'custom')),
    permissions   jsonb NOT NULL DEFAULT '[]'::jsonb,
    active        boolean NOT NULL DEFAULT true,
    created_by    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_idx ON admin_users(username);

-- Admin sessions for JWT tracking
CREATE TABLE IF NOT EXISTS admin_sessions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token      text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_sessions_token_idx ON admin_sessions(token);

-- Order change audit trail
CREATE TABLE IF NOT EXISTS order_history (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   text NOT NULL,
    user_id    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
    action     text NOT NULL,
    old_value  jsonb,
    new_value  jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_history_order_idx ON order_history(order_id);

-- RLS policies (app handles auth via JWT middleware)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_admin_users" ON admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_admin_sessions" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_order_history" ON order_history FOR ALL USING (true) WITH CHECK (true);
