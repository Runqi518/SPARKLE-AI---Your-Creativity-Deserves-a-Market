import { randomUUID } from "node:crypto";
import { DataTypes, UniqueConstraintError, type Transaction } from "sequelize";
import { Project, sequelize, syncDatabase } from "./db";
import { StudioError } from "./studio/http";
import { ImportOrdersSchema, type CreateOrderInput, type OrderRecord, type OrdersResponse, type UpdateOrderInput } from "../../schemas/order";
import { MarketTemplate, prepareLibrary } from "./library";
import { templates } from "../components/studio/campaign-templates";
import { currentActor } from "./actor";

// Snapshots deliberately survive deletion or renaming of the original canvas/template.
export const CommerceOrder = sequelize.models.CommerceOrder || sequelize.define("CommerceOrder", {
  id: { type: DataTypes.STRING, primaryKey: true },
  requestId: { type: DataTypes.STRING, unique: true, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  amountCents: { type: DataTypes.INTEGER, allowNull: false },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "USD" },
  status: { type: DataTypes.STRING, allowNull: false },
  projectId: DataTypes.STRING, templateId: DataTypes.STRING, clientName: DataTypes.STRING,
  deliveryUrl: DataTypes.TEXT, receiptReference: DataTypes.STRING,
  deliveredAt: DataTypes.DATE, paidAt: DataTypes.DATE,
  templateSnapshot: DataTypes.JSON, templateApplied: { type: DataTypes.BOOLEAN, defaultValue: false },
});
const Order = CommerceOrder;
let ready: Promise<void> | undefined;
async function prepare() {
  // Define and create only the new ledger table; never rebuild existing SQLite tables.
  if (!ready) ready = (async () => { await syncDatabase(); await Order.sync(); })().catch(error => { ready = undefined; throw error; });
  await ready;
}
export const prepareOrders = prepare;
function publicOrder(value: Record<string, unknown>): OrderRecord {
  const record = { ...value };
  delete record.requestId;
  delete record.updatedAt;
  delete record.ownerId;
  delete record.templateSnapshot;
  return JSON.parse(JSON.stringify(record)) as OrderRecord;
}
export async function listOrders(): Promise<OrdersResponse> {
  await prepare();
  const orders = (await Order.findAll({ order: [["createdAt", "DESC"], ["id", "DESC"]] })).map(row => publicOrder(row.toJSON()));
  const { Commission, prepareCommissions } = await import("./commissions");
  await prepareCommissions();
  const own = await Commission.findAll();
  for (const order of orders) {
    const commission = own.find(row => row.get("orderId") === order.id);
    if (commission) { order.role = "creator"; order.commissionId = String(commission.get("id")); order.commissionStatus = String(commission.get("status")); }
  }
  const purchases = await Commission.findAll({ ...{ hooks: false }, where: { buyerId: currentActor().id } });
  for (const commission of purchases) {
    const row = await Order.findOne({ ...{ hooks: false }, where: { id: commission.get("orderId"), ownerId: commission.get("ownerId") } });
    if (row) orders.push({ ...publicOrder(row.toJSON()), role: "buyer", commissionId: String(commission.get("id")), commissionStatus: String(commission.get("status")) });
  }
  const summary = { purchaseCents: 0, earnedCents: 0, pendingCents: 0, activeCommissions: 0 };
  for (const order of orders) {
    if (order.role === "buyer") { if (order.status === "paid") summary.purchaseCents += order.amountCents; }
    else if (order.type === "template_purchase") summary.purchaseCents += order.amountCents;
    else if (order.status === "paid") summary.earnedCents += order.amountCents;
    else if (order.status !== "cancelled") { summary.pendingCents += order.amountCents; summary.activeCommissions++; }
  }
  return { orders, summary };
}
export async function createOrder(input: CreateOrderInput, transaction?: Transaction): Promise<OrderRecord> {
  await prepare();
  const existing = async () => {
    const row = await Order.findOne({ where: { requestId: input.requestId }, transaction });
    if (!row) return null;
    for (const [key, value] of Object.entries(input)) if (row.get(key) !== value) throw new StudioError("This request ID already belongs to another order.", 409);
    return publicOrder(row.toJSON());
  };
  const prior = await existing();
  if (prior) return prior;
  let templateSnapshot: unknown = null;
  if (input.type === "template_purchase") {
    await prepareLibrary();
    const builtin = templates.find(template => template.id === input.templateId);
    const stored = builtin ? null : await MarketTemplate.findOne({ ...{ hooks: false }, where: { id: input.templateId, published: true } });
    if (!builtin && !stored) throw new StudioError("Published template not found.", 404);
    const price = builtin ? Math.round(builtin.price * 100) : Number(stored!.get("amountCents"));
    templateSnapshot = builtin || stored!.get("snapshot");
    if (input.amountCents !== price) throw new StudioError("Template price does not match the server catalog.", 409);
  }
  if (!await Project.findByPk(input.projectId, { transaction })) throw new StudioError("Choose an existing project for this order.", 404);
  try {
    return publicOrder((await Order.create({ ...input, templateSnapshot, id: randomUUID(), status: input.type === "template_purchase" ? "demo" : "in_progress" }, { transaction })).toJSON());
  } catch (error) {
    if (error instanceof UniqueConstraintError) { const prior = await existing(); if (prior) return prior; }
    throw error;
  }
}
export async function updateOrder(id: string, input: UpdateOrderInput): Promise<OrderRecord> {
  await prepare();
  const row = await Order.findByPk(id);
  if (!row) throw new StudioError("Order not found.", 404);
  const current = publicOrder(row.toJSON());
  const { Commission, updateCommission, prepareCommissions } = await import("./commissions");
  await prepareCommissions();
  const commission = await Commission.findOne({ where: { orderId: id } });
  if (commission) {
    if (input.action === "record_payment") throw new StudioError("Bounty payments require merchant acceptance and verified checkout.", 409);
    await updateCommission(String(commission.get("id")), input.action === "deliver" ? { action: "submit", deliveryUrl: input.deliveryUrl } : { action: "cancel" });
    await row.reload(); return publicOrder(row.toJSON());
  }
  if (current.type !== "ad_commission") throw new StudioError("Demo purchases cannot be delivered or marked as income.", 409);
  let changes: Record<string, unknown>;
  if (input.action === "deliver") {
    if (current.status === "delivered" && current.deliveryUrl === input.deliveryUrl) return current;
    if (current.status !== "in_progress") throw new StudioError("Only an in-progress order can be delivered.", 409);
    changes = { status: "delivered", deliveryUrl: input.deliveryUrl, deliveredAt: new Date() };
  } else if (input.action === "record_payment") {
    if (current.status === "paid" && current.receiptReference === input.receiptReference) return current;
    if (current.status !== "delivered") throw new StudioError("Deliver the ad before recording a received payment.", 409);
    changes = { status: "paid", receiptReference: input.receiptReference, paidAt: new Date() };
  } else {
    if (current.status === "cancelled") return current;
    if (current.status === "paid") throw new StudioError("A received payment cannot be cancelled.", 409);
    changes = { status: "cancelled" };
  }
  // Conditional update prevents competing delivery/cancel/payment requests overwriting each other.
  const [count] = await Order.update(changes, { where: { id, status: current.status } });
  if (!count) throw new StudioError("This order changed. Refresh and try again.", 409);
  await row.reload();
  return publicOrder(row.toJSON());
}
export async function importOrders(input: unknown) {
  const parsed = ImportOrdersSchema.safeParse(input);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  await prepare();
  await sequelize.transaction(async transaction => {
    for (const legacy of parsed.data.orders) {
      const amountCents = Math.round(legacy.amount * 100);
      if (amountCents < 1) throw new StudioError("Purchase amounts must be at least one cent.");
      const requestId = `legacy:${legacy.id}`;
      const existing = await Order.findOne({ where: { requestId }, transaction });
      if (existing) {
        if (existing.get("name") !== legacy.name || existing.get("amountCents") !== amountCents) throw new StudioError("A migrated purchase has conflicting details.", 409);
        continue;
      }
      await Order.create({ id: randomUUID(), requestId, type: "template_purchase", status: "demo", name: legacy.name, amountCents, createdAt: new Date(legacy.date) }, { transaction });
    }
  });
}
