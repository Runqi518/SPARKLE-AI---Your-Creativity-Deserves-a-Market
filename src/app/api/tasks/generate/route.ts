import { jsonResponse } from "@/lib/studio/http";
export async function POST() { return jsonResponse({ error: "Legacy generation was retired. Use /api/studio/generations; simulated successes are no longer supported." }, 410); }
