ALTER TABLE responses ADD COLUMN contact_status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE responses ADD COLUMN contact_note TEXT;
CREATE INDEX IF NOT EXISTS responses_contact_status_idx ON responses (contact_status);
