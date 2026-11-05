-- 002: Sounds catalog metadata (Milestone 2)
-- Adds optional product metadata for the Sounds section: file formats,
-- product version, human-readable download size, license summary, and an
-- audio preview URL. All columns are additive and nullable/defaulted, so
-- existing rows and code paths are unaffected until the fields are used.

ALTER TABLE product_inventory
  ADD COLUMN IF NOT EXISTS file_formats JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS version TEXT,
  ADD COLUMN IF NOT EXISTS download_size_label TEXT,
  ADD COLUMN IF NOT EXISTS license_summary TEXT,
  ADD COLUMN IF NOT EXISTS preview_url TEXT
    CHECK (
      preview_url IS NULL
      OR preview_url LIKE '/%'
      OR preview_url LIKE 'https://%'
    );
