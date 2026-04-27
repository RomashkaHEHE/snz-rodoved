import fs from "node:fs";
import path from "node:path";

const databasePath = path.resolve(process.env.DATABASE_URL ?? "./data/rodoved.sqlite");
const backupDir = path.resolve(process.env.BACKUP_DIR ?? "./backups");

if (!fs.existsSync(databasePath)) {
  console.error(`Database file not found: ${databasePath}`);
  process.exit(1);
}

fs.mkdirSync(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = path.join(backupDir, `rodoved-${timestamp}.sqlite`);

fs.copyFileSync(databasePath, target);
console.log(`Backup created: ${target}`);
