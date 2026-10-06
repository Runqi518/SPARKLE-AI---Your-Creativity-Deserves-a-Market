import { getGeneration } from "@/lib/studio/jobs";
import { errorResponse, jsonResponse } from "@/lib/studio/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return jsonResponse({ job: await getGeneration((await context.params).id) });
  } catch (error) { return errorResponse(error); }
}
