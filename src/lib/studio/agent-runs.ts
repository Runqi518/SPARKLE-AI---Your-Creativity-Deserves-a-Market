import { createHash, randomUUID } from "node:crypto";
import { DataTypes, Model, Op, UniqueConstraintError, type ModelStatic } from "sequelize";
import { z } from "zod";
import { sequelize } from "../db";
import { getProject } from "../projects";
import type { AgentRun, AgentTask } from "../../../schemas/studio-agent";
import { agents } from "./capabilities";
import { agentDefinitions } from "./agents";
import { executeAgent } from "./agents/execute";
import { assistantInputFields, assistantSource } from "./assistant-input";
import { configFingerprint, redact, requireProvider, type ProviderConfig } from "./config";
import { StudioError } from "./http";
import { withActor } from "../actor";
import { skillById } from "./skill-registry";

const inputSchema = z.object({
  ...assistantInputFields,
  requestId: z.string().uuid(), projectId: z.string().min(1).max(160),
  agents: z.array(z.string().refine(name => agents.some(agent => agent.name === name), "Choose a supported agent.")).min(1).max(agents.length),
  attachedSkillIds: z.array(z.string().refine(id => Boolean(skillById(id)), "Choose a supported skill.")).max(3).refine(ids => new Set(ids).size === ids.length, "Select each skill once.").default([]),
}).strict();
type Row = { id: string; requestId: string; inputHash: string; projectId: string; prompt: string; source: string; configHash: string; status: AgentRun["status"]; tasks: AgentTask[]; deadline: number; dispatchDeadline: number; createdAt: Date; updatedAt: Date };
type RunModel = Model<Row, Partial<Row>>;
export const StudioAgentRun = (sequelize.models.StudioAgentRun || sequelize.define<RunModel>("StudioAgentRun", {
  id: { type: DataTypes.STRING, primaryKey: true },
  requestId: { type: DataTypes.STRING, unique: true, allowNull: false },
  inputHash: { type: DataTypes.STRING, allowNull: false },
  projectId: { type: DataTypes.STRING, allowNull: false },
  prompt: { type: DataTypes.TEXT, allowNull: false },
  source: { type: DataTypes.TEXT, allowNull: false },
  configHash: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  tasks: { type: DataTypes.JSON, allowNull: false },
  deadline: { type: DataTypes.DOUBLE, allowNull: false },
  dispatchDeadline: { type: DataTypes.DOUBLE, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
}, { tableName: "StudioAgentRuns", indexes: [{ fields: ["projectId", "createdAt"] }] })) as ModelStatic<RunModel>;
let syncPromise: Promise<unknown> | undefined;
async function sync() {
  syncPromise ??= StudioAgentRun.sync().catch(error => { syncPromise = undefined; throw error; });
  await syncPromise;
}
async function requireProject(projectId: string) {
  if (!projectId || projectId.length > 160) throw new StudioError("A valid projectId is required.");
  if (projectId !== "demo" && !await getProject(projectId)) throw new StudioError("Project not found.", 404);
}
function publicRun(row: Row): AgentRun {
  function safe(value: unknown): unknown {
    if (typeof value === "string") return redact(value);
    if (Array.isArray(value)) return value.map(safe);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, safe(item)]));
    return value;
  }
  return safe({ id: row.id, requestId: row.requestId, projectId: row.projectId, prompt: row.prompt, attachedSkillIds: JSON.parse(row.source).attachedSkillIds || [], status: row.status, tasks: row.tasks,
    createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString() }) as AgentRun;
}
async function expire(row: Row) {
  const now = Date.now();
  if ((row.status === "queued" && row.dispatchDeadline <= now) || (row.status === "running" && row.deadline <= now)) {
    const tasks = row.tasks.map(task => ["queued", "running"].includes(task.status) ? {
      ...task, status: task.status === "running" ? "failed" as const : "blocked" as const,
      error: "Execution timed out or was interrupted. No automatic retry was made.", completedAt: new Date().toISOString(),
    } : task);
    await StudioAgentRun.update({ status: "failed", tasks }, { where: { id: row.id, status: row.status, updatedAt: row.updatedAt } });
  }
}
export async function getAgentRun(id: string) {
  await sync();
  let model = await StudioAgentRun.findByPk(id);
  if (!model) throw new StudioError("Agent run not found.", 404);
  await expire(model.get({ plain: true }));
  model = await StudioAgentRun.findByPk(id);
  return publicRun(model!.get({ plain: true }));
}
export async function listAgentRuns(projectId: string) {
  await requireProject(projectId); await sync();
  const rows = await StudioAgentRun.findAll({ where: { projectId }, order: [["createdAt", "DESC"]], limit: 30 });
  return Promise.all(rows.map(row => getAgentRun(row.get({ plain: true }).id)));
}
export async function createAgentRun(raw: unknown): Promise<{ run: AgentRun; config?: ProviderConfig }> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  const input = parsed.data;
  const source = JSON.stringify({ ...JSON.parse(assistantSource(input)), attachedSkillIds: input.attachedSkillIds });
  const selected = agentDefinitions.filter(agent => input.agents.includes(agent.name));
  for (const id of input.attachedSkillIds) {
    const skill = skillById(id)!;
    if (!selected.some(agent => skill.compatibleAgents.includes(agent.id))) throw new StudioError(`${skill.name} is not compatible with the selected agents.`);
    if (skill.dependencies.some(required => !input.attachedSkillIds.includes(required))) throw new StudioError(`${skill.name} requires another skill to be attached.`);
    if (skill.conflicts.some(other => input.attachedSkillIds.includes(other))) throw new StudioError(`${skill.name} conflicts with another attached skill.`);
  }
  const inputHash = createHash("sha256").update(JSON.stringify({ projectId: input.projectId, source, agents: selected.map(agent => agent.id) })).digest("hex");
  await requireProject(input.projectId); await sync();
  const existing = await StudioAgentRun.findOne({ where: { requestId: input.requestId } });
  if (existing) {
    if (existing.get("inputHash") !== inputHash) throw new StudioError("requestId was already used with different input.", 409);
    return { run: await getAgentRun(existing.get({ plain: true }).id) };
  }
  const config = requireProvider("text");
  const now = Date.now();
  const row: Partial<Row> = {
    id: randomUUID(), requestId: input.requestId, inputHash, projectId: input.projectId, prompt: input.prompt, source,
    configHash: configFingerprint(config), status: "queued", dispatchDeadline: now + 300000,
    deadline: now + Math.min(570000, config.timeoutMs * selected.length + 30000),
    tasks: selected.map(agent => ({ agentId: agent.id, name: agent.name, activeSkillIds: [...(agent.coreSkillIds || []), ...input.attachedSkillIds.filter(id => skillById(id)!.compatibleAgents.includes(agent.id))], dependencies: agent.dependencies.filter(id => selected.some(other => other.id === id)), status: "queued" })),
  };
  try { return { run: publicRun((await StudioAgentRun.create(row)).get({ plain: true })), config }; }
  catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    return createAgentRun(raw);
  }
}

export async function recoverAgentQueue() {
  await sync();
  const rows = await StudioAgentRun.findAll({ ...{ hooks: false }, where: { status: { [Op.in]: ["queued", "running"] } }, limit: 30 });
  for (const model of rows) {
    const row = model.get({ plain: true });
    await withActor({ id: String(model.get("ownerId" as keyof Row) || "local-workspace") }, async () => {
      if (row.status === "queued") {
        try {
          const config = requireProvider("text");
          if (configFingerprint(config) !== row.configHash) throw new StudioError("Provider configuration changed before submission.", 409);
          await runAgents(row.id, config);
        } catch { await StudioAgentRun.update({ status: "failed" }, { where: { id: row.id, status: "queued" } }); }
      } else await getAgentRun(row.id);
    });
  }
}
export async function cancelAgentRun(id: string) {
  const run = await getAgentRun(id);
  await StudioAgentRun.update({ status: "failed", tasks: run.tasks.map(task => ["queued", "running"].includes(task.status) ? { ...task, status: "failed", error: "Cancelled locally. Already submitted requests may still be billed." } : task) }, { where: { id, status: { [Op.in]: ["queued", "running"] } } });
  return getAgentRun(id);
}

export async function runAgents(id: string, config: ProviderConfig) {
  const now = Date.now();
  const [claimed] = await StudioAgentRun.update({ status: "running" }, { where: { id, status: "queued", dispatchDeadline: { [Op.gt]: now }, deadline: { [Op.gt]: now } } });
  if (!claimed) return;
  const row = (await StudioAgentRun.findByPk(id))!.get({ plain: true });
  const tasks = structuredClone(row.tasks);
  async function save(status: AgentRun["status"] = "running") {
    const [updated] = await StudioAgentRun.update({ tasks: structuredClone(tasks), status }, { where: { id, status: "running", deadline: { [Op.gt]: Date.now() } } });
    return updated > 0;
  }
  try {
    for (const task of tasks) {
      const dependencies = tasks.filter(other => task.dependencies.includes(other.agentId));
      if (dependencies.some(other => other.status !== "succeeded")) {
        task.status = "blocked";
        task.error = `Waiting for successful input from: ${dependencies.filter(other => other.status !== "succeeded").map(other => other.name).join(", ")}. Start a new request after resolving the missing input or failure.`;
        task.completedAt = new Date().toISOString();
        if (!await save()) break;
        continue;
      }
      task.status = "running"; task.startedAt = new Date().toISOString();
      if (!await save()) break;
      try {
        if (configFingerprint(requireProvider("text")) !== row.configHash) throw new StudioError("Provider configuration changed. Start a new request to use the new configuration.", 409);
        const remaining = row.deadline - Date.now();
        if (remaining <= 100) throw new StudioError("Agent execution time limit reached.", 504);
        const definition = agentDefinitions.find(agent => agent.id === task.agentId)!;
        task.result = await executeAgent(definition, row.source, dependencies, { ...config, timeoutMs: Math.min(config.timeoutMs, remaining) }, JSON.parse(row.source).attachedSkillIds || []);
        task.status = task.result.status === "ready" ? "succeeded" : "needs_input";
      } catch (error) {
        task.status = "failed";
        task.error = error instanceof StudioError ? redact(error.message) : "Agent execution failed. No automatic retry was made.";
      }
      task.completedAt = new Date().toISOString();
      if (!await save()) break;
    }
    const status = tasks.some(task => task.status === "failed") ? "failed" : tasks.some(task => task.status === "needs_input") ? "needs_input" : tasks.every(task => task.status === "succeeded") ? "succeeded" : "failed";
    await save(status);
    await expire((await StudioAgentRun.findByPk(id))!.get({ plain: true }));
  } catch {
    await StudioAgentRun.update({ status: "failed", tasks: tasks.map(task => ["running", "queued"].includes(task.status) ? { ...task, status: "failed", error: "Agent execution was interrupted. No automatic retry was made." } : task) }, { where: { id, status: "running" } });
  }
}
