import { createHash, randomUUID } from "node:crypto";
import { DataTypes, Op, UniqueConstraintError } from "sequelize";
import { sequelize, syncDatabase } from "../db";
import { StudioError } from "./http";
export const SkillRun = sequelize.models.SkillRun || sequelize.define("SkillRun", {
  id: { type: DataTypes.STRING, primaryKey: true }, requestId: { type: DataTypes.STRING, unique: true },
  projectId: DataTypes.STRING, inputHash: DataTypes.STRING, status: DataTypes.STRING, content: DataTypes.TEXT, error: DataTypes.TEXT, deadline: DataTypes.DATE,
});
let ready: Promise<unknown> | undefined;
export async function prepareSkillRuns() { ready ??= (async () => { await syncDatabase(); await SkillRun.sync(); })().catch(error => { ready = undefined; throw error; }); await ready; }
export async function listSkillRuns(projectId: string) {
  await prepareSkillRuns();
  if (projectId !== "demo" && !await (await import("../projects")).getProject(projectId)) throw new StudioError("Project not found.", 404);
  await SkillRun.update({ status: "failed", error: "Skill execution was interrupted. No automatic retry was made." }, { where: { projectId, status: "running", deadline: { [Op.lte]: new Date() } } });
  return SkillRun.findAll({ where: { projectId }, order: [["createdAt", "DESC"]], limit: 100 });
}
export async function runSkills(input: unknown, requestId: string | undefined, projectId: string | undefined, execute: () => Promise<string>): Promise<string> {
  await prepareSkillRuns();
  const inputHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  if (projectId && projectId !== "demo" && !await (await import("../projects")).getProject(projectId)) throw new StudioError("Project not found.", 404);
  const row = requestId ? await SkillRun.findOne({ where: { requestId } }) : null;
  if (row) {
    if (row.get("inputHash") !== inputHash) throw new StudioError("Skill request ID already has different inputs.", 409);
    if (row.get("status") === "succeeded") return String(row.get("content"));
    throw new StudioError(row.get("status") === "running" ? "This skill request is still running or was interrupted. Check its saved status before retrying." : String(row.get("error")), 409);
  }
  let record;
  try { record = await SkillRun.create({ id: randomUUID(), requestId: requestId || randomUUID(), projectId: projectId || "demo", inputHash, status: "running", deadline: new Date(Date.now() + 180000) }); }
  catch (error) { if (error instanceof UniqueConstraintError && requestId) return runSkills(input, requestId, projectId, execute); throw error; }
  try { const content = await execute(); const [saved] = await SkillRun.update({ status: "succeeded", content }, { where: { id: record.get("id"), status: "running", deadline: { [Op.gt]: new Date() } } }); if (!saved) throw new StudioError("Skill execution expired before its result could be saved.", 504); return content; }
  catch (error) { await record.update({ status: "failed", error: error instanceof StudioError ? error.message : "Skill execution failed. No automatic retry was made." }); throw error; }
}
