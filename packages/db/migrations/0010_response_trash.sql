ALTER TABLE responses ADD COLUMN deleted_at TEXT;
CREATE INDEX IF NOT EXISTS responses_deleted_at_idx ON responses (deleted_at);
