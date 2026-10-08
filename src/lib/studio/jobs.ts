import { randomUUID } from "node:crypto";
import { DataTypes, Model, Op, UniqueConstraintError, type ModelStatic } from "sequelize";
import { sequelize } from "../db";
import { getProject } from "../projects";
import type { GenerationCandidate, GenerationKind, StudioJob } from "../../../schemas/studio-generation";
import { configFingerprint, redact, requireProvider, type ProviderConfig } from "./config";
import { prepareInput, type PreparedInput } from "./input";
import { validateReference } from "./assets";
import { StudioError } from "./http";
import { pollVideo, submitGeneration } from "./providers";
import { withActor } from "../actor";
import { loadStandaloneSkill } from "./skill-loader";

type JobRow = {
  id: string; requestId: string; inputHash: string; projectId: string; nodeId: string;
  kind: GenerationKind; model: string; count: number; configHash: string;
  status: StudioJob["status"]; candidates: GenerationCandidate[]; error: string | null;
  providerJobId: string | null; deadline: number; submissionDeadline: number; preparedJson: string | null;
  nextPollAt: number; pollToken: string | null; createdAt: Date; updatedAt: Date;
};
type JobModel = Model<JobRow, Partial<JobRow>>;
// This table alone is explicitly synced. No existing models or migrations change.
export const StudioGeneration = (sequelize.models.StudioGeneration || sequelize.define<JobModel>("StudioGeneration", {
  id: { type: DataTypes.STRING, primaryKey: true },
  requestId: { type: DataTypes.STRING, allowNull: false, unique: true },
  inputHash: { type: DataTypes.STRING, allowNull: false },
  projectId: { type: DataTypes.STRING, allowNull: false },
  nodeId: { type: DataTypes.STRING, allowNull: false },
  kind: { type: DataTypes.STRING, allowNull: false },
  model: { type: DataTypes.STRING, allowNull: false },
  count: { type: DataTypes.INTEGER, allowNull: false },
  configHash: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false },
  candidates: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  error: { type: DataTypes.TEXT, allowNull: true },
  providerJobId: { type: DataTypes.STRING, allowNull: true },
  preparedJson: { type: DataTypes.TEXT, allowNull: true },
  deadline: { type: DataTypes.DOUBLE, allowNull: false },
  submissionDeadline: { type: DataTypes.DOUBLE, allowNull: false },
  nextPollAt: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
  pollToken: { type: DataTypes.STRING, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
}, { tableName: "StudioGenerations", indexes: [{ fields: ["projectId", "createdAt"] }] })) as ModelStatic<JobModel>;

let syncPromise: Promise<unknown> | undefined;
export async function syncStudioJobs() {
  syncPromise ??= StudioGeneration.sync().catch(error => { syncPromise = undefined; throw error; });
  await syncPromise;
}

function publicJob(row: JobRow): StudioJob {
  return {
    id: row.id, projectId: redact(row.projectId), nodeId: redact(row.nodeId), kind: row.kind, status: row.status,
    candidates: row.candidates.map(candidate => ({ id: candidate.id, kind: candidate.kind, ...(candidate.content !== undefined ? { content: redact(candidate.content) } : {}), ...(candidate.url !== undefined ? { url: redact(candidate.url) } : {}) })),
    ...(row.error ? { error: redact(row.error) } : {}), createdAt: new Date(row.createdAt).toISOString(), updatedAt: new Date(row.updatedAt).toISOString(),
  };
}
function safeError(error: unknown) {
  return error instanceof StudioError ? redact(error.message) : "Generation could not complete. No automatic submission retry was made.";
}
async function requireProject(projectId: string) {
  if (!projectId || projectId.length > 160) throw new StudioError("A valid projectId is required.");
  if (projectId !== "demo" && !await getProject(projectId)) throw new StudioError("Project not found.", 404);
}

export async function createGeneration(raw: unknown): Promise<{ job: StudioJob; submission?: { prepared: PreparedInput; config: ProviderConfig } }> {
  const prepared = prepareInput(raw);
  const { input, kind } = prepared;
  await requireProject(input.projectId);
  await syncStudioJobs();
  const existing = await StudioGeneration.findOne({ where: { requestId: input.requestId } });
  if (existing) {
    if (existing.get("inputHash") !== prepared.inputHash) throw new StudioError("requestId was already used with different input.", 409);
    return { job: await getGeneration(existing.get({ plain: true }).id, false) };
  }
  const config = requireProvider(kind, input.options.model);
  for (const image of prepared.images) validateReference(image, "image");
  for (const video of prepared.videos) validateReference(video, "video");
  if (redact(input.projectId) !== input.projectId || redact(input.nodeId) !== input.nodeId) throw new StudioError("IDs must not contain provider credentials.");
  const now = Date.now();
  try {
    const row = await StudioGeneration.create({
      id: randomUUID(), requestId: input.requestId, inputHash: prepared.inputHash,
      projectId: input.projectId, nodeId: input.nodeId, kind, model: config.model, count: input.options.count,
      configHash: configFingerprint(config), status: "queued", candidates: [],
      preparedJson: JSON.stringify(prepared),
      deadline: now + config.jobTimeoutMs, submissionDeadline: now + 300000,
      nextPollAt: 0, pollToken: null, providerJobId: null, error: null,
    });
    return { job: publicJob(row.get({ plain: true })), submission: { prepared, config } };
  } catch (error) {
    if (!(error instanceof UniqueConstraintError)) throw error;
    const duplicate = await StudioGeneration.findOne({ where: { requestId: input.requestId } });
    if (!duplicate || duplicate.get("inputHash") !== prepared.inputHash) throw new StudioError("requestId was already used with different input.", 409);
    return { job: await getGeneration(duplicate.get({ plain: true }).id, false) };
  }
}

export async function runGeneration(id: string, prepared: PreparedInput, config: ProviderConfig) {
  try {
    const now = Date.now();
    const [claimed] = await StudioGeneration.update({ status: "running", submissionDeadline: now + config.timeoutMs + 15000 }, {
      where: { id, status: "queued", submissionDeadline: { [Op.gt]: now }, deadline: { [Op.gt]: now } },
    });
    if (!claimed) return;
    let prompt = prepared.prompt;
    if (prepared.input.mediaSkillId) {
      const skill = await loadStandaloneSkill(prepared.input.mediaSkillId);
      const section = (heading: string) => skill.split(`## ${heading}\n`)[1]?.split(/\n## /)[0]?.trim() || "";
      const guidance = [section("Professional model"), section("Decision rules and constraints")].filter(Boolean).join("\n\n");
      if (!guidance) throw new StudioError("Media skill instructions are unavailable.", 503);
      prompt = `Create an actual ${prepared.kind} candidate for the following advertising brief. Apply these production constraints where the configured provider supports them. Do not render invented logos, packaging text or claims as approved brand assets.\n\n${guidance}\n\nAdvertising brief and upstream canvas context:\n${prepared.prompt}`;
    }
    const result = await submitGeneration(config, { prompt, images: prepared.images, videos: prepared.videos, options: prepared.input.options });
    await expireJobs(undefined, id);
    await StudioGeneration.update({
      status: result.providerJobId ? "running" : "succeeded", candidates: result.candidates,
      error: result.warning || null,
      providerJobId: result.providerJobId ?? null, nextPollAt: Date.now() + config.pollIntervalMs,
    }, { where: { id, status: "running", providerJobId: null } });
  } catch (error) {
    // Never log provider payloads, keys, URLs, or Sequelize errors containing bound input.
    try { await StudioGeneration.update({ status: "failed", error: safeError(error) }, { where: { id, status: { [Op.in]: ["queued", "running"] } } }); }
    catch { /* A later recovery read marks the expired submission as interrupted. */ }
  }
}

async function expireJobs(projectId?: string, id?: string) {
  const now = Date.now();
  await StudioGeneration.update({ status: "failed", error: "Generation timed out or submission was interrupted. The provider may still bill it. It was not automatically retried.", pollToken: null }, {
    where: {
      ...(projectId ? { projectId } : {}), ...(id ? { id } : {}),
      status: { [Op.in]: ["queued", "running"] },
      [Op.or]: [{ deadline: { [Op.lte]: now } }, { providerJobId: null, submissionDeadline: { [Op.lte]: now } }],
    },
  });
}

export async function getGeneration(id: string, poll = true): Promise<StudioJob> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new StudioError("Generation not found.", 404);
  await syncStudioJobs();
  await expireJobs(undefined, id);
  let model = await StudioGeneration.findByPk(id);
  if (!model) throw new StudioError("Generation not found.", 404);
  const row = model.get({ plain: true });
  if (poll && row.status === "running" && row.providerJobId && row.nextPollAt <= Date.now()) {
    const token = randomUUID();
    let claimed = false;
    try {
      const config = requireProvider("video", row.model);
      if (configFingerprint(config) !== row.configHash) throw new StudioError("Video provider configuration changed. Restore the original configuration to resume polling.", 503);
      const [updated] = await StudioGeneration.update({ pollToken: token, nextPollAt: Date.now() + config.timeoutMs + config.pollIntervalMs }, {
        where: { id, status: "running", nextPollAt: { [Op.lte]: Date.now() } },
      });
      claimed = Boolean(updated);
      if (claimed) {
        const result = await pollVideo(config, row.providerJobId, row.count);
        await expireJobs(undefined, id);
        await StudioGeneration.update({
          ...(result.candidates.length ? { status: "succeeded", candidates: result.candidates } : {}),
          error: result.warning || null, pollToken: null, nextPollAt: Date.now() + config.pollIntervalMs,
        }, { where: { id, status: "running", pollToken: token } });
      }
    } catch (error) {
      if (!claimed) throw error;
      // Status requests are read-only, but ambiguous provider errors are terminal, not hidden successes.
      await StudioGeneration.update({ status: "failed", error: safeError(error), pollToken: null }, { where: { id, status: "running", pollToken: token } });
    }
    model = await StudioGeneration.findByPk(id);
  }
  if (!model) throw new StudioError("Generation not found.", 404);
  return publicJob(model.get({ plain: true }));
}
export async function generationByRequest(requestId: string, projectId: string) {
  await requireProject(projectId); await syncStudioJobs();
  const row = await StudioGeneration.findOne({ where: { requestId, projectId } });
  return row ? getGeneration(String(row.get("id")), false) : null;
}

export async function listGenerations(projectId: string) {
  await requireProject(projectId);
  await syncStudioJobs();
  await expireJobs(projectId);
  const rows = await StudioGeneration.findAll({ where: { projectId }, order: [["createdAt", "DESC"], ["id", "DESC"]], limit: 100 });
  return rows.map(row => publicJob(row.get({ plain: true })));
}

export async function cancelGeneration(id: string) {
  await getGeneration(id, false);
  await StudioGeneration.update({ status: "failed", error: "Cancelled locally. A provider submission already in progress may still be billed.", pollToken: null }, { where: { id, status: { [Op.in]: ["queued", "running"] } } });
  return getGeneration(id, false);
}

export async function recoverGenerationQueue() {
  await syncStudioJobs();
  // Internal worker inventory is never returned by a public API; every job runs in its recorded owner context.
  const rows = await StudioGeneration.findAll({ ...{ hooks: false }, where: { status: { [Op.in]: ["queued", "running"] } }, limit: 50 });
  for (const model of rows) {
    const row = model.get({ plain: true });
    const ownerId = String(model.get("ownerId" as keyof JobRow) || "local-workspace");
    await withActor({ id: ownerId }, async () => {
      if (row.status === "queued" && row.preparedJson) {
        try {
          const config = requireProvider(row.kind, row.model);
          if (configFingerprint(config) !== row.configHash) throw new StudioError("Provider configuration changed before submission.", 409);
          await runGeneration(row.id, JSON.parse(row.preparedJson), config);
        } catch (error) { await StudioGeneration.update({ status: "failed", error: safeError(error) }, { where: { id: row.id, status: "queued" } }); }
      } else await getGeneration(row.id).catch(() => {});
    });
  }
}
