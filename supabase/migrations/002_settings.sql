-- ============================================================
-- Migration 002: Settings Table
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name      text NOT NULL DEFAULT 'Nano Bijoux',
    phone           text DEFAULT '',
    facebook        text DEFAULT '',
    instagram       text DEFAULT '',
    primary_color   text DEFAULT '#B8860B',
    logo            text,
    ecotrack_token    text,
    ecotrack_enabled  boolean DEFAULT false,
    ecotrack_api_url  text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default settings row
INSERT INTO settings (store_name) VALUES ('Nano Bijoux') ON CONFLICT DO NOTHING;
