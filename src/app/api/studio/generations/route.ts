import { captureActor } from "@/lib/actor";
import { api } from "@/lib/auth";
import { after } from "next/server";
import { createGeneration, generationByRequest, listGenerations, runGeneration } from "@/lib/studio/jobs";
import { errorResponse, jsonResponse, readInput } from "@/lib/studio/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

async function POSTHandler(request: Request) {
  try {
    const { job, submission } = await createGeneration(await readInput(request));
    if (submission) after(captureActor(() => runGeneration(job.id, submission.prepared, submission.config)));
    return jsonResponse({ job }, 202);
  } catch (error) { return errorResponse(error); }
}

async function GETHandler(request: Request) {
  try {
    const projectId = new URL(request.url).searchParams.get("projectId") || "";
    const requestId = new URL(request.url).searchParams.get("requestId");
    if (requestId) return jsonResponse({ job: await generationByRequest(requestId, projectId) });
    return jsonResponse({ jobs: await listGenerations(projectId) });
  } catch (error) { return errorResponse(error); }
}

export const POST = api(POSTHandler);
export const GET = api(GETHandler);
