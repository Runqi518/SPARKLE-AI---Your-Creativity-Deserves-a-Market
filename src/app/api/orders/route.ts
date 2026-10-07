import { api } from "@/lib/auth";
import { CreateOrderSchema } from "../../../../schemas/order";
import { createOrder, listOrders } from "@/lib/orders";
import { errorResponse, jsonResponse, readInput, StudioError } from "@/lib/studio/http";

async function GETHandler() {
  try { return jsonResponse(await listOrders()); } catch (error) { return errorResponse(error); }
}
async function POSTHandler(request: Request) {
  try {
    const input = CreateOrderSchema.safeParse(await readInput(request));
    if (!input.success) throw new StudioError(input.error.issues[0].message);
    return jsonResponse({ order: await createOrder(input.data) }, 201);
  } catch (error) { return errorResponse(error); }
}

export const GET = api(GETHandler);
export const POST = api(POSTHandler);
