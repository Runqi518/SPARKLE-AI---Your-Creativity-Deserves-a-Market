import { DataTypes, Transaction } from "sequelize";
import { z } from "zod";
import { sequelize, syncDatabase } from "./db";
import { currentActor } from "./actor";
import { databaseWrite } from "./db/migrations";
import { CanvasSnapshotSchema } from "../../schemas/project";
import { StudioError } from "./studio/http";
export const Workspace = sequelize.models.Workspace || sequelize.define("Workspace", { id: { type: DataTypes.STRING, primaryKey: true }, name: DataTypes.STRING, canvas: DataTypes.JSON, revision: { type: DataTypes.INTEGER, defaultValue: 0 } });
export async function loadDemo() {
  await syncDatabase(); await Workspace.sync();
  const row = await Workspace.findByPk(`${currentActor().id}:demo`);
  return row ? { name: String(row.get("name")), canvas: row.get("canvas"), revision: Number(row.get("revision")) } : null;
}
export async function saveDemo(raw: unknown) {
  const parsed = z.object({ name: z.string().trim().min(1).max(160), canvas: CanvasSnapshotSchema, revision: z.number().int().nonnegative() }).safeParse(raw);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  await loadDemo();
  return databaseWrite(() => sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
    const id = `${currentActor().id}:demo`, row = await Workspace.findByPk(id, { transaction });
    if (Number(row?.get("revision") || 0) !== parsed.data.revision) throw new StudioError("This canvas changed in another tab. Reload before saving.", 409);
    const values = { name: parsed.data.name, canvas: parsed.data.canvas, revision: parsed.data.revision + 1 };
    if (row) await row.update(values, { transaction }); else await Workspace.create({ id, ...values }, { transaction });
    return values;
  }));
}
