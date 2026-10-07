import { api } from "@/lib/auth";
import { importOrders } from "@/lib/orders";
import { errorResponse, jsonResponse, readInput } from "@/lib/studio/http";

async function POSTHandler(request: Request) {
  try { await importOrders(await readInput(request)); return jsonResponse({ imported: true }); }
  catch (error) { return errorResponse(error); }
}

export const POST = api(POSTHandler);
