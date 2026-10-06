import { after } from "next/server";
import { createGeneration, listGenerations, runGeneration } from "@/lib/studio/jobs";
import { errorResponse, jsonResponse, readInput } from "@/lib/studio/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const { job, submission } = await createGeneration(await readInput(request));
    if (submission) after(() => runGeneration(job.id, submission.prepared, submission.config));
    return jsonResponse({ job }, 202);
  } catch (error) { return errorResponse(error); }
}

export async function GET(request: Request) {
  try {
    const projectId = new URL(request.url).searchParams.get("projectId") || "";
    return jsonResponse({ jobs: await listGenerations(projectId) });
  } catch (error) { return errorResponse(error); }
}
