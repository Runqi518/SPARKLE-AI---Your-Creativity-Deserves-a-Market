import { agentDefinitions } from "@/lib/studio/agents";
import { jsonResponse } from "@/lib/studio/http";
export const runtime = "nodejs";
export async function GET() { return jsonResponse({ agents: agentDefinitions }); }
