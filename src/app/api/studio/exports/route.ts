import { after } from "next/server";
import { api } from "@/lib/auth";
import { captureActor } from "@/lib/actor";
import { createRender, runRender } from "@/lib/render";
import { jsonResponse, readInput } from "@/lib/studio/http";
export const runtime = "nodejs";
export const maxDuration = 600;
export const POST = api(async (request: Request) => { const job = await createRender(await readInput(request)); after(captureActor(() => runRender(String(job.id)))); return jsonResponse({ job }, 202); });
