ALTER TABLE responses ADD COLUMN is_fake TEXT NOT NULL DEFAULT 'false';
CREATE INDEX IF NOT EXISTS responses_is_fake_idx ON responses (is_fake);
