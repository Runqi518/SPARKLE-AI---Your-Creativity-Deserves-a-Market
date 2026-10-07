import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";

const runtime = globalThis as typeof globalThis & { sparkleWriteQueue?: Promise<void> };
// Serialize writes to the single SQLite connection; all multi-row workflows also use transactions.
export function databaseWrite<T>(work: () => Promise<T>): Promise<T> {
  const next = (runtime.sparkleWriteQueue || Promise.resolve()).then(work, work);
  runtime.sparkleWriteQueue = next.then(() => {}, () => {});
  return next;
}

export function installMigrations(sequelize: Sequelize, storage: string) {
  let backedUp = false;
  sequelize.addHook("beforeSync", async function (this: ModelStatic<Model>) {
    if (typeof this.getTableName !== "function") return;
    const table = this.getTableName();
    const name = typeof table === "string" ? table : table.tableName;
    const query = sequelize.getQueryInterface();
    const tables = await query.showAllTables();
    if (!tables.includes(name)) return;
    const columns = await query.describeTable(name);
    const additions = Object.entries(this.getAttributes()).filter(([key]) => !columns[key]);
    if (!additions.length) return;
    if (!backedUp && storage !== ":memory:") {
      const directory = path.join(path.dirname(storage), "backups");
      await mkdir(directory, { recursive: true });
      await sequelize.query("VACUUM INTO :file", { replacements: { file: path.join(directory, `before-migration-${Date.now()}.sqlite`) } });
      backedUp = true;
    }
    await sequelize.query('CREATE TABLE IF NOT EXISTS "SchemaMigrations" ("version" TEXT PRIMARY KEY, "appliedAt" TEXT NOT NULL)');
    for (const [key, attribute] of additions) {
      // Additive changes preserve existing tables, foreign keys and business records.
      await query.addColumn(name, key, { ...attribute, type: attribute.type || DataTypes.STRING });
      await sequelize.query('INSERT OR IGNORE INTO "SchemaMigrations" ("version", "appliedAt") VALUES (:version, :at)', {
        replacements: { version: `20261007:${name}:${key}`, at: new Date().toISOString() },
      });
    }
  });
}
