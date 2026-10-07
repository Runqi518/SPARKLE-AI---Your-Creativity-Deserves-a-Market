import { z } from "zod";

const name = z.string().trim().min(1).max(160);
const amountCents = z.number().int().min(1).max(100_000_000);
const identity = { requestId: z.string().min(1).max(180), name, amountCents, projectId: z.string().min(1).max(160) };
export const CreateOrderSchema = z.discriminatedUnion("type", [
  z.object({ ...identity, type: z.literal("template_purchase"), templateId: z.string().min(1).max(160) }).strict(),
  z.object({ ...identity, type: z.literal("ad_commission"), clientName: name }).strict(),
]);
const deliveryUrl = z.string().trim().max(2000).refine((value) => {
  if (/^\/(uploads|project)\/[^\s\\]+$/.test(value)) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "Use an http(s) delivery link, an uploaded asset, or a project link.");
export const UpdateOrderSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("deliver"), deliveryUrl }).strict(),
  z.object({ action: z.literal("record_payment"), receiptReference: z.string().trim().min(1).max(200) }).strict(),
  z.object({ action: z.literal("cancel") }).strict(),
]);
export const ImportOrdersSchema = z.object({ orders: z.array(z.object({
  id: z.string().min(1).max(160), name, amount: z.number().positive().max(1_000_000),
  kind: z.literal("Demo template purchase"), date: z.iso.datetime(),
}).strict()).max(200) }).strict();

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type OrderRecord = {
  role?: "creator" | "buyer";
  commissionId?: string;
  commissionStatus?: string;
  id: string;
  type: "template_purchase" | "ad_commission";
  name: string;
  amountCents: number;
  currency: "USD";
  status: "demo" | "in_progress" | "delivered" | "paid" | "cancelled";
  projectId: string | null;
  templateId: string | null;
  clientName: string | null;
  deliveryUrl: string | null;
  receiptReference: string | null;
  deliveredAt: string | null;
  paidAt: string | null;
  createdAt: string;
};
export type OrdersResponse = {
  orders: OrderRecord[];
  summary: { purchaseCents: number; earnedCents: number; pendingCents: number; activeCommissions: number };
};
