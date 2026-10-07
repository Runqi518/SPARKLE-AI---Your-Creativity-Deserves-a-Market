import { api } from "@/lib/auth";
import { getRender } from "@/lib/render";
import { jsonResponse } from "@/lib/studio/http";
export const GET = api(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => jsonResponse({ job: await getRender((await params).id) }));
