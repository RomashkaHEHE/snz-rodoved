import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "./migrate.js";
import * as schema from "./schema.js";

export interface DatabaseConnection {
  sqlite: Database.Database;
  db: BetterSQLite3Database<typeof schema>;
  close: () => void;
}

export interface CreateDatabaseConnectionOptions {
  databasePath?: string;
  migrate?: boolean;
}

export function createDatabaseConnection(
  options: CreateDatabaseConnectionOptions = {}
): DatabaseConnection {
  const databasePath = options.databasePath ?? process.env.DATABASE_URL ?? "./data/rodoved.sqlite";

  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  }

  const sqlite = new Database(databasePath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  if (options.migrate !== false) {
    runMigrations(sqlite);
  }

  return {
    sqlite,
    db: drizzle(sqlite, { schema }),
    close: () => sqlite.close()
  };
}
