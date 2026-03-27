-- ============================================================
-- Migration 003: Tracking Pixels Table
-- ============================================================

CREATE TABLE IF NOT EXISTS pixels (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    type       text NOT NULL DEFAULT 'other',
    mode       text NOT NULL DEFAULT 'snippet',
    pixel_id   text,
    code       text,
    active     boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_pixels" ON pixels FOR ALL USING (true) WITH CHECK (true);
