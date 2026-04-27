import type Database from "better-sqlite3";

export const initialMigrationSql = `
CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY NOT NULL,
  survey_date TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  age_group TEXT NOT NULL CHECK (age_group IN ('under_18', '18_40', 'over_40')),
  residence TEXT NOT NULL CHECK (residence IN ('snezhinsk', 'other')),
  q4 TEXT NOT NULL DEFAULT 'unknown' CHECK (q4 IN ('yes', 'no', 'unknown')),
  q5 TEXT NOT NULL DEFAULT 'unknown' CHECK (q5 IN ('yes', 'no', 'unknown')),
  q6 TEXT NOT NULL DEFAULT 'unknown' CHECK (q6 IN ('yes', 'no', 'unknown')),
  q7 TEXT NOT NULL DEFAULT 'unknown' CHECK (q7 IN ('yes', 'no', 'unknown')),
  q8 TEXT NOT NULL DEFAULT 'unknown' CHECK (q8 IN ('yes', 'no', 'unknown')),
  q9 TEXT NOT NULL DEFAULT 'unknown' CHECK (q9 IN ('yes', 'no', 'unknown')),
  q10 TEXT NOT NULL DEFAULT 'unknown' CHECK (q10 IN ('yes', 'no', 'unknown')),
  q11 TEXT NOT NULL DEFAULT 'unknown' CHECK (q11 IN ('yes', 'no', 'unknown')),
  q11_war_details TEXT,
  q12 TEXT NOT NULL DEFAULT 'unknown' CHECK (q12 IN ('yes', 'no', 'unknown')),
  q13 TEXT NOT NULL DEFAULT 'unknown' CHECK (q13 IN ('yes', 'no', 'unknown')),
  q14 TEXT NOT NULL DEFAULT 'unknown' CHECK (q14 IN ('yes', 'no', 'unknown')),
  q15 TEXT NOT NULL DEFAULT 'unknown' CHECK (q15 IN ('yes', 'no', 'unknown')),
  q16 TEXT NOT NULL DEFAULT 'unknown' CHECK (q16 IN ('yes', 'no', 'unknown')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS responses_survey_date_idx ON responses (survey_date);
CREATE INDEX IF NOT EXISTS responses_gender_idx ON responses (gender);
CREATE INDEX IF NOT EXISTS responses_age_group_idx ON responses (age_group);
CREATE INDEX IF NOT EXISTS responses_residence_idx ON responses (residence);
`;

export const fakeResponseMigrationSql = `
ALTER TABLE responses ADD COLUMN is_fake TEXT NOT NULL DEFAULT 'false';
CREATE INDEX IF NOT EXISTS responses_is_fake_idx ON responses (is_fake);
`;

const migrations = [
  {
    id: "0001_initial",
    sql: initialMigrationSql
  },
  {
    id: "0002_fake_responses",
    sql: fakeResponseMigrationSql
  }
] as const;

export function runMigrations(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __app_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  for (const migration of migrations) {
    const alreadyApplied = sqlite
      .prepare("SELECT id FROM __app_migrations WHERE id = ?")
      .get(migration.id);

    if (alreadyApplied) {
      continue;
    }

    const apply = sqlite.transaction(() => {
      sqlite.exec(migration.sql);
      sqlite
        .prepare("INSERT INTO __app_migrations (id, applied_at) VALUES (?, ?)")
        .run(migration.id, new Date().toISOString());
    });

    apply();
  }
}
