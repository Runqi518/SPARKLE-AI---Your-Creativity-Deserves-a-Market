import { api } from "@/lib/auth";
import { UpdateOrderSchema } from "../../../../../schemas/order";
import { updateOrder } from "@/lib/orders";
import { errorResponse, jsonResponse, readInput, StudioError } from "@/lib/studio/http";

async function PATCHHandler(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const input = UpdateOrderSchema.safeParse(await readInput(request));
    if (!input.success) throw new StudioError(input.error.issues[0].message);
    return jsonResponse({ order: await updateOrder((await context.params).id, input.data) });
  } catch (error) { return errorResponse(error); }
}

export const PATCH = api(PATCHHandler);
