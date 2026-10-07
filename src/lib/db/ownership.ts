import { DataTypes, Op, type Sequelize, type Model, type FindOptions, type UpdateOptions, type DestroyOptions } from "sequelize";
import { currentActor, LOCAL_OWNER } from "../actor";

const systemModels = new Set(["User", "Session", "SchemaMigration", "PaymentEvent", "ApiUsage"]);
export function installOwnership(sequelize: Sequelize) {
  sequelize.addHook("beforeDefine", (attributes, options) => {
    if (systemModels.has(options.modelName || "")) return;
    attributes.ownerId = { type: DataTypes.STRING, allowNull: false, defaultValue: LOCAL_OWNER };
    const scope = (opts: FindOptions | UpdateOptions | DestroyOptions) => {
      opts.where = { [Op.and]: [opts.where || {}, { ownerId: currentActor().id }] };
    };
    const hooks = options.hooks ||= {};
    hooks.beforeFind = scope;
    hooks.beforeCount = scope;
    hooks.beforeBulkUpdate = scope;
    hooks.beforeBulkDestroy = scope;
    hooks.beforeCreate = (row: Model) => { row.set("ownerId", currentActor().id); };
    hooks.beforeBulkCreate = (rows: Model[]) => { for (const row of rows) row.set("ownerId", currentActor().id); };
    hooks.beforeUpdate = (row: Model) => {
      if (row.get("ownerId") !== currentActor().id || (row.changed() || []).includes("ownerId")) throw new Error("Resource ownership cannot be changed.");
    };
    hooks.beforeDestroy = (row: Model) => {
      if (row.get("ownerId") !== currentActor().id) throw new Error("Resource belongs to another account.");
    };
  });
}
