import { api } from "@/lib/auth";
import { wallet, createPayout } from "@/lib/payments";
import { jsonResponse, readInput } from "@/lib/studio/http";
export const GET = api(async () => jsonResponse(await wallet()));
export const POST = api(async (request: Request) => jsonResponse({ payout: await createPayout(await readInput(request)) }, 201));
