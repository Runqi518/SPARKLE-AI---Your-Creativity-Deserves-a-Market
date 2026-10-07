import { api } from "@/lib/auth";
import { loadChat, saveChat } from "@/lib/library";
import { errorResponse, jsonResponse, readInput } from "@/lib/studio/http";
type Context = { params: Promise<{ id: string }> };
export const GET = api(async (_request: Request, context: Context) => { try { return jsonResponse(await loadChat((await context.params).id)); } catch (error) { return errorResponse(error); } });
export const PUT = api(async (request: Request, context: Context) => { try { return jsonResponse(await saveChat((await context.params).id, await readInput(request))); } catch (error) { return errorResponse(error); } });
