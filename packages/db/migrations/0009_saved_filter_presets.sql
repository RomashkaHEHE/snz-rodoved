CREATE TABLE IF NOT EXISTS saved_filter_presets (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  filters_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS saved_filter_presets_name_idx
  ON saved_filter_presets (name);
CREATE INDEX IF NOT EXISTS saved_filter_presets_updated_at_idx
  ON saved_filter_presets (updated_at);
