import { providerSummaries } from "@/lib/studio/config";
import { jsonResponse } from "@/lib/studio/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return jsonResponse({ providers: providerSummaries() });
}
