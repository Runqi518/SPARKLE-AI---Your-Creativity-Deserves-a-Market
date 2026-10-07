import { api } from "@/lib/auth";
import { loadDemo, saveDemo } from "@/lib/workspace";
import { readInput, jsonResponse } from "@/lib/studio/http";
export const GET = api(async () => jsonResponse({ project: await loadDemo() }));
export const PUT = api(async (request: Request) => jsonResponse({ project: await saveDemo(await readInput(request)) }));
