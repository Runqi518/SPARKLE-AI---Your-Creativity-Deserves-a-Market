import { api } from "@/lib/auth";
import { getGeneration, cancelGeneration } from "@/lib/studio/jobs";
import { errorResponse, jsonResponse } from "@/lib/studio/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

async function GETHandler(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return jsonResponse({ job: await getGeneration((await context.params).id) });
  } catch (error) { return errorResponse(error); }
}

export const GET = api(GETHandler);
export const DELETE = api(async (_request: Request, context: { params: Promise<{ id: string }> }) => jsonResponse({ job: await cancelGeneration((await context.params).id) }));
