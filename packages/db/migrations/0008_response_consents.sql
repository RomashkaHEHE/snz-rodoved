ALTER TABLE responses ADD COLUMN consent_to_data_processing INTEGER
  CHECK (consent_to_data_processing IN (0, 1));
ALTER TABLE responses ADD COLUMN consent_to_events INTEGER
  CHECK (consent_to_events IN (0, 1));
