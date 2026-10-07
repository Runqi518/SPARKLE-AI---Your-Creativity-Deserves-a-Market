import { createHmac, createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { DataTypes, Op, Transaction } from "sequelize";
import { z } from "zod";
import { sequelize, syncDatabase } from "./db";
import { currentActor, withActor } from "./actor";
import { databaseWrite } from "./db/migrations";
import { CommerceOrder } from "./orders";
import { Commission, prepareCommissions } from "./commissions";
import { MarketTemplate, prepareLibrary } from "./library";
import { StudioError } from "./studio/http";

export const Payment = sequelize.models.Payment || sequelize.define("Payment", {
  id: { type: DataTypes.STRING, primaryKey: true }, requestId: { type: DataTypes.STRING, unique: true, allowNull: false },
  orderId: { type: DataTypes.STRING, allowNull: false }, sellerId: DataTypes.STRING,
  amountCents: DataTypes.INTEGER, currency: { type: DataTypes.STRING, defaultValue: "USD" },
  status: { type: DataTypes.STRING, defaultValue: "created" }, providerId: DataTypes.STRING, checkoutUrl: DataTypes.TEXT,
});
export const PaymentEvent = sequelize.models.PaymentEvent || sequelize.define("PaymentEvent", { id: { type: DataTypes.STRING, primaryKey: true }, type: DataTypes.STRING, paymentId: DataTypes.STRING, payloadHash: DataTypes.STRING });
export const WalletEntry = sequelize.models.WalletEntry || sequelize.define("WalletEntry", { id: { type: DataTypes.STRING, primaryKey: true }, amountCents: DataTypes.INTEGER, sourceId: DataTypes.STRING, kind: DataTypes.STRING });
export const Payout = sequelize.models.Payout || sequelize.define("Payout", { id: { type: DataTypes.STRING, primaryKey: true }, requestId: { type: DataTypes.STRING, unique: true }, amountCents: DataTypes.INTEGER, destinationId: DataTypes.STRING, status: DataTypes.STRING, providerId: DataTypes.STRING });
export const TemplateEntitlement = sequelize.models.TemplateEntitlement || sequelize.define("TemplateEntitlement", { id: { type: DataTypes.STRING, primaryKey: true }, templateId: DataTypes.STRING, paymentId: DataTypes.STRING, snapshot: DataTypes.JSON });
let ready: Promise<unknown> | undefined;
export async function preparePayments() { ready ??= (async () => { await syncDatabase(); await prepareLibrary(); await prepareCommissions(); for (const model of [Payment, PaymentEvent, WalletEntry, Payout, TemplateEntitlement]) await model.sync(); })().catch(error => { ready = undefined; throw error; }); await ready; }
export function paymentConfigured() { return Boolean(process.env.SPARKLE_PAYMENT_BASE_URL && process.env.SPARKLE_PAYMENT_API_KEY && process.env.SPARKLE_PAYMENT_WEBHOOK_SECRET); }
async function gateway(action: string, id: string, payload: unknown) {
  if (!paymentConfigured()) throw new StudioError("Configure the payment gateway before charging or withdrawing money.", 503);
  const base = new URL(process.env.SPARKLE_PAYMENT_BASE_URL!);
  if (base.protocol !== "https:" || base.username || base.password) throw new StudioError("Payment gateway must use HTTPS.", 503);
  let response;
  try { response = await fetch(`${base.toString().replace(/\/$/, "")}/${action}`, { method: "POST", redirect: "error", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SPARKLE_PAYMENT_API_KEY}`, "Idempotency-Key": id }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) }); }
  catch { throw new StudioError("Payment submission is unresolved. Do not create another payment; reconcile the same request ID with the gateway.", 502); }
  if (!response.ok) { await response.body?.cancel(); throw new StudioError("Payment gateway rejected the request. No charge or payout is assumed successful.", 502); }
  const { boundedJson } = await import("./studio/http");
  const raw = await boundedJson(response.body, 100000, 502);
  const parsed = z.object({ id: z.string().min(1).max(200), url: z.string().url().max(2000).optional() }).safeParse(raw);
  if (!parsed.success || (parsed.data.url && new URL(parsed.data.url).protocol !== "https:")) throw new StudioError("Invalid payment gateway response.", 502);
  return parsed.data;
}
export async function createCheckout(raw: unknown) {
  const input = z.object({ requestId: z.uuid(), orderId: z.string().min(1).max(160) }).strict().safeParse(raw);
  if (!input.success) throw new StudioError(input.error.issues[0].message);
  if (!paymentConfigured()) throw new StudioError("Payments are not configured. No charge was made.", 503);
  await preparePayments();
  const actor = currentActor();
  const prior = await Payment.findOne({ where: { requestId: input.data.requestId } });
  if (prior) { if (prior.get("orderId") !== input.data.orderId) throw new StudioError("Payment request ID belongs to another order.", 409); return prior.toJSON(); }
  let order = await CommerceOrder.findByPk(input.data.orderId);
  let sellerId = "", amount = 0;
  if (!order) {
    const commission = await Commission.findOne({ ...{ hooks: false }, where: { orderId: input.data.orderId, buyerId: actor.id, status: "accepted" } });
    if (!commission) throw new StudioError("Accepted commission order not found.", 404);
    sellerId = String(commission.get("ownerId"));
    order = await withActor({ id: sellerId }, () => CommerceOrder.findByPk(input.data.orderId));
    amount = Number(order?.get("amountCents"));
  } else {
    if (order.get("type") !== "template_purchase") throw new StudioError("The merchant pays an accepted commission.", 403);
    const template = await MarketTemplate.findOne({ ...{ hooks: false }, where: { id: order.get("templateId"), published: true } });
    if (!template) throw new StudioError("Paid checkout requires a published server template.", 404);
    sellerId = String(template.get("ownerId")); amount = Number(template.get("amountCents"));
    if (await TemplateEntitlement.findOne({ where: { templateId: template.get("id") } })) throw new StudioError("You already own this template.", 409);
    if (sellerId === actor.id) throw new StudioError("You cannot buy your own template.", 409);
    if (amount !== Number(order.get("amountCents"))) throw new StudioError("Template price changed. Recreate the order at the current price.", 409);
  }
  if (!order || order.get("status") === "paid" || amount < 1) throw new StudioError("Order is not payable.", 409);
  const payment = await databaseWrite(() => sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
    const latest = await CommerceOrder.findOne({ ...{ hooks: false }, where: { id: input.data.orderId, ownerId: order!.get("ownerId") }, transaction });
    if (!latest || ["paid", "cancelled"].includes(String(latest.get("status")))) throw new StudioError("Order changed and is no longer payable.", 409);
    if (latest.get("type") === "ad_commission" && !await Commission.findOne({ ...{ hooks: false }, where: { orderId: input.data.orderId, buyerId: actor.id, status: "accepted" }, transaction })) throw new StudioError("Merchant acceptance is required before payment.", 409);
    if (await Payment.findOne({ ...{ hooks: false }, where: { orderId: input.data.orderId, status: { [Op.notIn]: ["failed", "refunded"] } }, transaction })) throw new StudioError("This order already has a payment attempt. Reconcile it before creating another.", 409);
    return Payment.create({ id: randomUUID(), requestId: input.data.requestId, orderId: input.data.orderId, sellerId, amountCents: amount, status: "submitting" }, { transaction });
  }));
  const result = await gateway("checkout", String(payment.get("id")), { id: payment.get("id"), amountCents: amount, currency: "USD", orderId: input.data.orderId, sellerId });
  await Payment.update({ providerId: result.id, checkoutUrl: result.url || null, status: "pending" }, { where: { id: payment.get("id"), status: "submitting" } });
  await payment.reload();
  return payment.toJSON();
}
export async function wallet() {
  await preparePayments();
  const balanceCents = Number(await WalletEntry.sum("amountCents", { where: { ownerId: currentActor().id } }) || 0);
  return { balanceCents, currency: "USD", payouts: (await Payout.findAll({ order: [["createdAt", "DESC"]], limit: 100 })).map(row => row.toJSON()) };
}
export async function createPayout(raw: unknown) {
  const parsed = z.object({ requestId: z.uuid(), amountCents: z.number().int().min(100).max(100000000), destinationId: z.string().trim().min(1).max(200) }).strict().safeParse(raw);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  if (!paymentConfigured()) throw new StudioError("Withdrawals are not configured.", 503);
  await preparePayments();
  const existing = await Payout.findOne({ where: { requestId: parsed.data.requestId } });
  if (existing) {
    if (existing.get("amountCents") !== parsed.data.amountCents || existing.get("destinationId") !== parsed.data.destinationId) throw new StudioError("Payout request ID belongs to a different withdrawal.", 409);
    return existing.toJSON();
  }
  const payout = await databaseWrite(() => sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
    const balance = Number(await WalletEntry.sum("amountCents", { where: { ownerId: currentActor().id }, transaction }) || 0);
    if (balance < parsed.data.amountCents) throw new StudioError("Insufficient verified available earnings.", 409);
    const id = randomUUID();
    const row = await Payout.create({ ...parsed.data, id, status: "submitting" }, { transaction });
    await WalletEntry.create({ id: `withdraw:${id}`, sourceId: id, kind: "payout_reservation", amountCents: -parsed.data.amountCents }, { transaction });
    return row;
  }));
  const result = await gateway("payout", String(payout.get("id")), { id: payout.get("id"), amountCents: parsed.data.amountCents, currency: "USD", destinationId: parsed.data.destinationId });
  await Payout.update({ status: "pending", providerId: result.id }, { where: { id: payout.get("id"), status: "submitting" } });
  await payout.reload();
  return payout.toJSON();
}
export async function applyPaymentEvent(body: string, timestamp: string | null, signature: string | null) {
  const secret = process.env.SPARKLE_PAYMENT_WEBHOOK_SECRET;
  if (!secret) throw new StudioError("Payment webhook is not configured.", 503);
  if (!timestamp || !/^\d{10}$/.test(timestamp) || Math.abs(Date.now()/1000 - Number(timestamp)) > 300 || !signature || !/^[a-f0-9]{64}$/i.test(signature)) throw new StudioError("Invalid payment signature.", 401);
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) throw new StudioError("Invalid payment signature.", 401);
  let decoded: unknown; try { decoded = JSON.parse(body); } catch { throw new StudioError("Invalid payment event."); }
  const parsed = z.object({ id: z.string().min(1).max(200), type: z.enum(["payment.succeeded", "payment.failed", "payment.refunded", "payout.succeeded", "payout.failed"]), objectId: z.string().min(1).max(160), amountCents: z.number().int().min(1).max(100000000), currency: z.literal("USD") }).strict().safeParse(decoded);
  if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  const event = parsed.data; await preparePayments();
  return databaseWrite(() => sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
    const recorded = await PaymentEvent.findByPk(event.id, { transaction });
    if (recorded) { if (recorded.get("type") !== event.type || recorded.get("paymentId") !== event.objectId || (recorded.get("payloadHash") && recorded.get("payloadHash") !== createHash("sha256").update(body).digest("hex"))) throw new StudioError("Event ID belongs to a different settlement.", 409); return { duplicate: true }; }
    const row = await (event.type.startsWith("payment.") ? Payment : Payout).findByPk(event.objectId, { ...{ hooks: false }, transaction });
    if (!row || Number(row.get("amountCents")) !== event.amountCents) throw new StudioError("Payment amount or object mismatch.", 409);
    await withActor({ id: String(row.get("ownerId")) }, async () => {
      if (event.type === "payment.succeeded") {
        if (row.get("status") === "refunded") throw new StudioError("Refunded payment cannot be credited again.", 409);
        if (row.get("status") !== "succeeded") {
          await row.update({ status: "succeeded" }, { transaction });
          const order = await CommerceOrder.findByPk(String(row.get("orderId")), { ...{ hooks: false }, transaction });
          if (!order) throw new StudioError("Payment order is missing.", 409);
          await withActor({ id: String(order.get("ownerId")) }, () => order.update({ status: "paid", paidAt: new Date(), receiptReference: event.id }, { transaction }));
          if (order.get("type") === "template_purchase") await TemplateEntitlement.create({ id: `${currentActor().id}:${order.get("templateId")}`, templateId: order.get("templateId"), paymentId: row.get("id"), snapshot: order.get("templateSnapshot") }, { transaction });
          await withActor({ id: String(row.get("sellerId")) }, () => WalletEntry.create({ id: `earn:${row.get("id")}`, sourceId: row.get("id"), kind: "verified_payment", amountCents: event.amountCents }, { transaction }));
        }
      } else if (event.type === "payment.failed") {
        if (["succeeded", "refunded"].includes(String(row.get("status")))) throw new StudioError("A settled payment cannot be marked failed.", 409);
        await row.update({ status: "failed" }, { transaction });
      } else if (event.type === "payment.refunded") {
        if (row.get("status") === "refunded") return;
        if (row.get("status") !== "succeeded") throw new StudioError("Only a settled payment can be refunded.", 409);
        await row.update({ status: "refunded" }, { transaction });
        await TemplateEntitlement.destroy({ where: { paymentId: row.get("id") }, transaction });
        const order = await CommerceOrder.findByPk(String(row.get("orderId")), { ...{ hooks: false }, transaction });
        if (order) await withActor({ id: String(order.get("ownerId")) }, () => order.update({ status: "cancelled" }, { transaction }));
        await withActor({ id: String(row.get("sellerId")) }, () => WalletEntry.create({ id: `refund:${row.get("id")}`, sourceId: row.get("id"), kind: "refund", amountCents: -event.amountCents }, { transaction }));
      } else {
        if (["succeeded", "failed"].includes(String(row.get("status")))) { if (row.get("status") !== event.type.split(".")[1]) throw new StudioError("Conflicting payout settlement.", 409); }
        else {
          await row.update({ status: event.type === "payout.succeeded" ? "succeeded" : "failed" }, { transaction });
          if (event.type === "payout.failed") await WalletEntry.create({ id: `release:${row.get("id")}`, sourceId: row.get("id"), kind: "payout_release", amountCents: event.amountCents }, { transaction });
        }
      }
    });
    await PaymentEvent.create({ id: event.id, type: event.type, paymentId: event.objectId, payloadHash: createHash("sha256").update(body).digest("hex") }, { transaction });
    return { received: true };
  }));
}
