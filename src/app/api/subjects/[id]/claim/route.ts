import { api } from "@/lib/auth";
import { claimBounty } from "@/lib/commissions";
import { jsonResponse, readInput } from "@/lib/studio/http";
export const POST = api(async (request: Request, { params }: { params: Promise<{ id: string }> }) => jsonResponse({ commission: await claimBounty((await params).id, await readInput(request)) }, 201));
