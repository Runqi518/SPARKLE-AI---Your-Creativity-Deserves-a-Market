import { z } from "zod";
import { api } from "@/lib/auth";
import { Subject, syncDatabase } from "@/lib/db";
import { availableSubjects } from "@/lib/commissions";
import { jsonResponse, readInput, StudioError } from "@/lib/studio/http";
const schema = z.object({ name: z.string().trim().min(1).max(160), type: z.enum(["product", "campaign", "service", "ip", "brand"]).default("product"), brief: z.string().max(20000).default(""), targetAudience: z.string().max(2000).default(""), sellingPoints: z.array(z.string().max(2000)).max(30).default([]), referenceAssets: z.array(z.string().max(2000)).max(16).default([]), brandKit: z.object({ colors: z.array(z.string().max(32)).max(16).default([]), tone: z.string().max(2000).default(""), forbidden: z.array(z.string().max(1000)).max(30).default([]) }).nullable().optional(), rewardCents: z.number().int().min(0).max(100000000).default(0) }).strict();
export const GET = api(async () => jsonResponse({ subjects: await availableSubjects() }));
export const POST = api(async (request: Request) => {
  const parsed = schema.safeParse(await readInput(request)); if (!parsed.success) throw new StudioError(parsed.error.issues[0].message);
  await syncDatabase();
  return jsonResponse({ subject: await Subject.create(parsed.data) }, 201);
});
