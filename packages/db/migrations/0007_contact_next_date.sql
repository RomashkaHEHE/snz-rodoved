ALTER TABLE responses ADD COLUMN contact_next_date TEXT;
CREATE INDEX IF NOT EXISTS responses_contact_next_date_idx ON responses (contact_next_date);
