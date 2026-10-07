import { DataTypes } from "sequelize";
import { z } from "zod";
import { sequelize, syncDatabase, Project } from "./db";
import { currentActor } from "./actor";
import { databaseWrite } from "./db/migrations";
import { StudioError } from "./studio/http";
import { CanvasSnapshotSchema } from "../../schemas/project";

export const LibraryAsset = sequelize.models.LibraryAsset || sequelize.define("LibraryAsset", {
  id: { type: DataTypes.STRING, primaryKey: true }, name: { type: DataTypes.STRING, allowNull: false },
  kind: { type: DataTypes.STRING, allowNull: false }, url: { type: DataTypes.TEXT, allowNull: false },
  bytes: { type: DataTypes.INTEGER, defaultValue: 0 }, deletedAt: DataTypes.DATE,
});
export const MarketTemplate = sequelize.models.MarketTemplate || sequelize.define("MarketTemplate", {
  id: { type: DataTypes.STRING, primaryKey: true }, projectId: DataTypes.STRING,
  published: { type: DataTypes.BOOLEAN, defaultValue: false }, amountCents: { type: DataTypes.INTEGER, allowNull: false },
  snapshot: { type: DataTypes.JSON, allowNull: false }, version: { type: DataTypes.INTEGER, defaultValue: 1 },
});
export const TemplateVersion = sequelize.models.TemplateVersion || sequelize.define("TemplateVersion", {
  id: { type: DataTypes.STRING, primaryKey: true }, templateId: DataTypes.STRING,
  version: DataTypes.INTEGER, snapshot: DataTypes.JSON,
});
export const ChatSession = sequelize.models.ChatSession || sequelize.define("ChatSession", {
  id: { type: DataTypes.STRING, primaryKey: true }, projectId: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.JSON, allowNull: false }, revision: { type: DataTypes.INTEGER, defaultValue: 0 },
});
const mediaUrl = z.string().max(20000).refine(value => /^\/(uploads|template-campaigns)\/[A-Za-z0-9_-]+\.[a-z0-9]+$/i.test(value) || /^\/studio-(product|object)\.svg$/.test(value) || /^https?:\/\//i.test(value), "Use a supported media URL.");
export const assetSchema = z.object({ id: z.string().min(1).max(160), name: z.string().trim().min(1).max(160), kind: z.enum(["image", "video", "audio", "text"]), url: mediaUrl }).strict();
export const templateSchema = z.object({ id: z.string().min(1).max(160), name: z.string().trim().min(1).max(160), category: z.string().max(80), description: z.string().max(12000), image: mediaUrl, price: z.number().finite().min(0).max(1000000), published: z.boolean().optional(), projectId: z.string().max(160).optional(), nodes: z.array(z.unknown()).max(200).default([]), edges: z.array(z.unknown()).max(1000).default([]) }).passthrough();
let ready: Promise<void> | undefined;
export async function prepareLibrary() {
  ready ??= (async () => { await syncDatabase(); for (const model of [LibraryAsset, MarketTemplate, TemplateVersion, ChatSession]) await model.sync(); })().catch(error => { ready = undefined; throw error; });
  await ready;
}
export async function library(kind: "assets" | "templates") {
  await prepareLibrary();
  if (kind === "assets") return (await LibraryAsset.findAll({ where: { deletedAt: null }, order: [["createdAt", "ASC"]] })).map(row => ({ id: row.get("id"), name: row.get("name"), kind: row.get("kind"), url: row.get("url") }));
  return (await MarketTemplate.findAll({ where: { ownerId: currentActor().id }, order: [["createdAt", "ASC"]] })).map(row => row.get("snapshot"));
}
export async function saveLibraryItem(kind: "assets" | "templates", raw: unknown) {
  const parsed = (kind === "assets" ? assetSchema : templateSchema).safeParse(raw);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  await prepareLibrary();
  if (kind === "templates") {
    const { authorizeMedia } = await import("./media");
    const template = parsed.data as z.infer<typeof templateSchema>;
    const urls = [template.image, ...template.nodes.flatMap(node => node && typeof node === "object" && "data" in node && node.data && typeof node.data === "object" && "url" in node.data && typeof node.data.url === "string" ? [node.data.url] : [])];
    for (const url of urls) if (url.startsWith("/uploads/")) await authorizeMedia(url);
  }
  return databaseWrite(() => sequelize.transaction(async transaction => {
    const value = parsed.data;
    const model = kind === "assets" ? LibraryAsset : MarketTemplate;
    const existing = await model.findByPk(value.id, { transaction, ...{ hooks: false } });
    if (existing && existing.get("ownerId") !== currentActor().id) throw new StudioError("This item belongs to another account.", 403);
    if (kind === "assets") {
      const previous = existing?.get("url");
      if (previous && previous !== value.url) throw new StudioError("Uploaded file identity cannot change.", 409);
      if (/^\/uploads\//.test(String(value.url)) && !existing && process.env.SPARKLE_AUTH_MODE === "accounts") throw new StudioError("Upload this file before adding it to your library.", 403);
      if (existing) await existing.update({ name: value.name, deletedAt: null }, { transaction });
      else await LibraryAsset.create(value, { transaction });
    } else {
      const template = value as z.infer<typeof templateSchema>;
      const canvas = CanvasSnapshotSchema.safeParse({ nodes: template.nodes, edges: template.edges });
      if (!canvas.success) throw new StudioError(canvas.error.issues[0].message);
      if (template.projectId && template.projectId !== "demo" && !await Project.findByPk(template.projectId, { transaction })) throw new StudioError("Template project not found.", 404);
      const version = Number(existing?.get("version") || 0) + 1;
      const snapshot = { ...template, published: template.published !== false };
      const fields = { projectId: template.projectId, published: snapshot.published, amountCents: Math.round(template.price * 100), snapshot, version };
      if (existing) await existing.update(fields, { transaction }); else await MarketTemplate.create({ id: template.id, ...fields }, { transaction });
      await TemplateVersion.create({ id: `${template.id}:${version}`, templateId: template.id, version, snapshot }, { transaction });
    }
    return value;
  }));
}
export async function deleteLibraryItem(kind: "assets" | "templates", id: string) {
  await prepareLibrary();
  if (kind === "assets") await LibraryAsset.update({ deletedAt: new Date() }, { where: { id } });
  else { await MarketTemplate.destroy({ where: { id } }); await TemplateVersion.destroy({ where: { templateId: id } }); }
}
export async function loadChat(projectId: string) {
  await prepareLibrary();
  if (projectId !== "demo" && !await Project.findByPk(projectId)) throw new StudioError("Project not found.", 404);
  const row = await ChatSession.findByPk(`${currentActor().id}:${projectId}`);
  return { state: row?.get("state") ?? null, revision: Number(row?.get("revision") || 0) };
}
export async function saveChat(projectId: string, raw: unknown) {
  const schema = z.object({ revision: z.number().int().nonnegative().optional(), state: z.object({ team: z.array(z.string().max(100)).max(8), skills: z.array(z.string().max(100)).max(16), attachedSkillIds: z.array(z.string().max(100)).max(16).optional(), executionMode: z.enum(["agents", "skills"]).optional(), references: z.array(z.string().max(160)).max(16).optional(), messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(30000) }).passthrough()).max(1000) }) });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  await loadChat(projectId);
  return databaseWrite(() => sequelize.transaction(async transaction => {
    const id = `${currentActor().id}:${projectId}`;
    const row = await ChatSession.findByPk(id, { transaction });
    const revision = Number(row?.get("revision") || 0);
    if (parsed.data.revision !== undefined && parsed.data.revision !== revision) throw new StudioError("This conversation changed in another tab. Reload to retrieve it.", 409);
    if (row) await row.update({ state: parsed.data.state, revision: revision + 1 }, { transaction });
    else await ChatSession.create({ id, projectId, state: parsed.data.state, revision: revision + 1 }, { transaction });
    return { revision: revision + 1 };
  }));
}
