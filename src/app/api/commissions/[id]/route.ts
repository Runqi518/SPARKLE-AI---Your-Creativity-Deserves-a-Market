import { api } from "@/lib/auth";
import { updateCommission } from "@/lib/commissions";
import { jsonResponse, readInput } from "@/lib/studio/http";
export const PATCH = api(async (request: Request, { params }: { params: Promise<{ id: string }> }) => jsonResponse({ commission: await updateCommission((await params).id, await readInput(request)) }));
