import { captureActor } from "@/lib/actor";
import { api } from "@/lib/auth";
import { after } from "next/server";
import { createAgentRun, listAgentRuns, runAgents } from "@/lib/studio/agent-runs";
import { errorResponse, jsonResponse, readInput } from "@/lib/studio/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

async function POSTHandler(request: Request) {
  try {
    const { run, config } = await createAgentRun(await readInput(request));
    if (config) after(captureActor(() => runAgents(run.id, config)));
    return jsonResponse({ run }, 202);
  } catch (error) { return errorResponse(error); }
}
async function GETHandler(request: Request) {
  try { return jsonResponse({ runs: await listAgentRuns(new URL(request.url).searchParams.get("projectId") || "") }); }
  catch (error) { return errorResponse(error); }
}

export const POST = api(POSTHandler);
export const GET = api(GETHandler);
