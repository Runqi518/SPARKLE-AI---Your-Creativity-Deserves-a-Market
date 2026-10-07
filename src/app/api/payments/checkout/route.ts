import { api } from "@/lib/auth";
import { createCheckout } from "@/lib/payments";
import { jsonResponse, readInput } from "@/lib/studio/http";
export const POST = api(async (request: Request) => jsonResponse({ payment: await createCheckout(await readInput(request)) }, 201));
