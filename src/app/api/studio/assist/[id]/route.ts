import { api } from "@/lib/auth";
import { getAgentRun, cancelAgentRun } from "@/lib/studio/agent-runs";
import { errorResponse, jsonResponse } from "@/lib/studio/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function GETHandler(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return jsonResponse({ run: await getAgentRun((await params).id) }); }
  catch (error) { return errorResponse(error); }
}

export const GET = api(GETHandler);
export const DELETE = api(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => jsonResponse({ run: await cancelAgentRun((await params).id) }));
