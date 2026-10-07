import { jsonResponse } from "@/lib/studio/http";
export async function GET() { return jsonResponse({ error: "Legacy generation was retired. Use /api/studio/generations." }, 410); }
