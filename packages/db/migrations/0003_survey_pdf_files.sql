CREATE TABLE IF NOT EXISTS survey_pdf_files (
  id TEXT PRIMARY KEY NOT NULL,
  survey_date TEXT NOT NULL,
  display_name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  stored_file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS survey_pdf_files_survey_date_idx ON survey_pdf_files (survey_date);
CREATE UNIQUE INDEX IF NOT EXISTS survey_pdf_files_display_name_idx ON survey_pdf_files (display_name);
CREATE UNIQUE INDEX IF NOT EXISTS survey_pdf_files_stored_file_name_idx ON survey_pdf_files (stored_file_name);
