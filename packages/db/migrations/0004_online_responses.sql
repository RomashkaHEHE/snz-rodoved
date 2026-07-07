ALTER TABLE responses ADD COLUMN source TEXT NOT NULL DEFAULT 'paper';
ALTER TABLE responses ADD COLUMN research_territory TEXT;
ALTER TABLE responses ADD COLUMN research_period_start INTEGER;
ALTER TABLE responses ADD COLUMN research_period_end INTEGER;
ALTER TABLE responses ADD COLUMN free_text TEXT;
CREATE INDEX IF NOT EXISTS responses_source_idx ON responses (source);
