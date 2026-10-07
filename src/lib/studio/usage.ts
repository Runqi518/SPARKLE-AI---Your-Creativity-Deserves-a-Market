import { DataTypes, Transaction } from "sequelize";
import { sequelize, syncDatabase } from "../db";
import { currentActor } from "../actor";
import { StudioError } from "./http";
import { databaseWrite } from "../db/migrations";
export const ApiUsage = sequelize.models.ApiUsage || sequelize.define("ApiUsage", {
  id: { type: DataTypes.STRING, primaryKey: true }, userId: DataTypes.STRING,
  calls: { type: DataTypes.INTEGER, defaultValue: 0 }, date: DataTypes.STRING,
});
let ready: Promise<unknown> | undefined;
export async function reserveProviderCall() {
  ready ??= (async () => { await syncDatabase(); await ApiUsage.sync(); })().catch(error => { ready = undefined; throw error; });
  await ready;
  const userId = currentActor().id, date = new Date().toISOString().slice(0, 10);
  const limit = Number(process.env.SPARKLE_DAILY_API_CALL_LIMIT || 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100000) throw new StudioError("Invalid API call quota configuration.", 503);
  await databaseWrite(() => sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
    const id = `${userId}:${date}`;
    const row = await ApiUsage.findByPk(id, { transaction });
    if (row && Number(row.get("calls")) >= limit) throw new StudioError("Daily API call quota reached. Adjust the server quota before submitting more generations.", 429);
    if (row) await row.increment("calls", { transaction });
    else await ApiUsage.create({ id, userId, date, calls: 1 }, { transaction });
  }));
}
