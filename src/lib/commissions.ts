import { randomUUID } from "node:crypto";
import { DataTypes, Transaction } from "sequelize";
import { z } from "zod";
import { sequelize, Subject, syncDatabase } from "./db";
import { currentActor, LOCAL_OWNER, withActor } from "./actor";
import { databaseWrite } from "./db/migrations";
import { createProject } from "./projects";
import { createOrder, prepareOrders } from "./orders";
import { StudioError } from "./studio/http";

export const Commission = sequelize.models.Commission || sequelize.define("Commission", {
  id: { type: DataTypes.STRING, primaryKey: true }, requestId: { type: DataTypes.STRING, unique: true, allowNull: false },
  subjectId: { type: DataTypes.STRING, unique: true, allowNull: false }, buyerId: { type: DataTypes.STRING, allowNull: false },
  projectId: DataTypes.STRING, orderId: DataTypes.STRING, status: { type: DataTypes.STRING, defaultValue: "in_progress" },
  deliveryUrl: DataTypes.TEXT, feedback: DataTypes.TEXT, acceptedAt: DataTypes.DATE,
});
let ready: Promise<unknown> | undefined;
export async function prepareCommissions() { ready ??= (async () => { await syncDatabase(); await Commission.sync(); })().catch(error => { ready = undefined; throw error; }); await ready; }
export async function availableSubjects() {
  await syncDatabase();
  // Published bounty briefs are shared intentionally. Private projects, orders and assets stay scoped.
  const rows = await Subject.findAll({ ...{ hooks: false }, where: { status: "active" }, order: [["createdAt", "DESC"]] });
  return rows.map(row => row.toJSON());
}
export async function requireSubject(id: string) {
  let subject = await Subject.findByPk(id);
  if (!subject && id.startsWith("demo-bounty-")) subject = await withActor({ id: LOCAL_OWNER }, () => Subject.findByPk(id));
  if (!subject) {
    subject = await Subject.findOne({ ...{ hooks: false }, where: { id, status: "active" } });
  }
  if (!subject) throw new StudioError("Bounty not found.", 404);
  return subject;
}
export async function claimBounty(subjectId: string, raw: unknown) {
  const parsed = z.object({ requestId: z.uuid() }).strict().safeParse(raw);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  await prepareCommissions();
  const prior = await Commission.findOne({ where: { requestId: parsed.data.requestId } });
  if (prior) { if (prior.get("subjectId") !== subjectId) throw new StudioError("Request ID belongs to a different bounty.", 409); return prior.toJSON(); }
  const subject = await requireSubject(subjectId);
  const reward = Number(subject.get("rewardCents") || 0);
  if (reward < 1) throw new StudioError("This brief has no configured commission reward. Create a project from it without a paid commission.", 409);
  if (subject.get("ownerId") === currentActor().id) throw new StudioError("A merchant cannot claim their own paid bounty.", 409);
  await prepareOrders();
  return databaseWrite(() => sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
    const duplicate = await Commission.findOne({ where: { requestId: parsed.data.requestId }, transaction });
    if (duplicate) { if (duplicate.get("subjectId") !== subjectId) throw new StudioError("Request ID belongs to a different bounty.", 409); return duplicate.toJSON(); }
    const currentSubject = await Subject.findOne({ ...{ hooks: false }, where: { id: subjectId, status: "active" }, transaction });
    if (!currentSubject || currentSubject.get("ownerId") === currentActor().id || Number(currentSubject.get("rewardCents")) !== reward) throw new StudioError("Bounty changed or is unavailable. Reload before claiming it.", 409);
    if (await Commission.findOne({ ...{ hooks: false }, where: { subjectId }, transaction })) throw new StudioError("This bounty is already assigned.", 409);
    const project = await createProject({ name: String(subject.get("name")).slice(0,50), mode: "free", industry: "Internet", subjectId }, transaction);
    const row = await Commission.create({ id: randomUUID(), requestId: parsed.data.requestId, subjectId, buyerId: subject.get("ownerId"), projectId: project.id }, { transaction });
    const order = await createOrder({ requestId: `commission:${row.get("id")}`, type: "ad_commission", projectId: project.id, name: String(subject.get("name")), amountCents: reward, clientName: String(subject.get("name")) }, transaction);
    await row.update({ orderId: order.id }, { transaction });
    return row.toJSON();
  }));
}
export async function updateCommission(id: string, raw: unknown) {
  const parsed = z.discriminatedUnion("action", [z.object({ action: z.literal("submit"), deliveryUrl: z.string().max(2000).refine(value => {
    if (/^\/uploads\/[A-Za-z0-9_-]+\.(mp4|webm)$/.test(value)) return true;
    try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !/[\s]/.test(value); } catch { return false; }
  }, "Deliver an MP4 or an HTTP(S) finished-ad link.") }).strict(), z.object({ action: z.literal("accept") }).strict(), z.object({ action: z.literal("cancel") }).strict(), z.object({ action: z.literal("request_changes"), feedback: z.string().trim().min(1).max(5000) }).strict()]).safeParse(raw);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  await prepareCommissions();
  const row = await Commission.findOne({ ...{ hooks: false }, where: { id } });
  if (!row) throw new StudioError("Commission not found.", 404);
  const creator = row.get("ownerId") === currentActor().id, buyer = row.get("buyerId") === currentActor().id;
  if (!creator && !buyer) throw new StudioError("Commission not found.", 404);
  const input = parsed.data;
  if ((input.action === "submit" && !creator) || (!["submit", "cancel"].includes(input.action) && !buyer)) throw new StudioError("This action is not available to your role.", 403);
  const status = row.get("status");
  if (input.action === "submit") {
    if (!["in_progress", "changes_requested"].includes(String(status))) throw new StudioError("Commission cannot be submitted in its current state.", 409);
  } else if (input.action !== "cancel" && status !== "submitted") throw new StudioError("Review a submitted delivery first.", 409);
  if (input.action === "submit" && input.deliveryUrl.startsWith("/uploads/")) await (await import("./media")).authorizeMedia(input.deliveryUrl);
  const changes = input.action === "submit" ? { status: "submitted", deliveryUrl: input.deliveryUrl } : input.action === "accept" ? { status: "accepted", acceptedAt: new Date() } : input.action === "cancel" ? { status: "cancelled" } : { status: "changes_requested", feedback: input.feedback };
  await withActor({ id: String(row.get("ownerId")) }, () => databaseWrite(() => sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
    const { CommerceOrder } = await import("./orders");
    const order = await CommerceOrder.findByPk(String(row.get("orderId")), { transaction });
    if (!order) throw new StudioError("Commission order is missing.", 409);
    if (input.action === "cancel" && order.get("status") === "paid") throw new StudioError("Paid commissions require a verified refund before cancellation.", 409);
    if (input.action === "cancel" && sequelize.models.Payment && await sequelize.models.Payment.findOne({ ...{ hooks: false }, where: { orderId: row.get("orderId"), status: ["submitting", "pending", "succeeded"] }, transaction })) throw new StudioError("Reconcile the existing payment before cancelling this commission.", 409);
    const [changed] = await Commission.update(changes, { where: { id, status }, transaction });
    if (!changed) throw new StudioError("Commission changed. Reload and try again.", 409);
    if (input.action === "submit") await order.update({ status: "delivered", deliveryUrl: input.deliveryUrl, deliveredAt: new Date() }, { transaction });
    else if (input.action === "request_changes") await order.update({ status: "in_progress" }, { transaction });
    else if (input.action === "cancel") await order.update({ status: "cancelled" }, { transaction });
  })));
  return { id, ...changes };
}
