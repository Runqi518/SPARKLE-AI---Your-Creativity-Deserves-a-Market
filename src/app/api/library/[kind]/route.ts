import { api } from "@/lib/auth";
import { library, saveLibraryItem, deleteLibraryItem } from "@/lib/library";
import { errorResponse, jsonResponse, readInput, StudioError } from "@/lib/studio/http";
type Context = { params: Promise<{ kind: string }> };
async function kindOf(context: Context) { const { kind } = await context.params; if (kind !== "assets" && kind !== "templates") throw new StudioError("Library not found.", 404); return kind; }
export const GET = api(async (_request: Request, context: Context) => { try { return jsonResponse({ items: await library(await kindOf(context)) }); } catch (error) { return errorResponse(error); } });
export const POST = api(async (request: Request, context: Context) => { try { return jsonResponse({ item: await saveLibraryItem(await kindOf(context), await readInput(request)) }); } catch (error) { return errorResponse(error); } });
export const DELETE = api(async (request: Request, context: Context) => { try { const raw = await readInput(request); if (!raw || typeof raw !== "object" || !("id" in raw) || typeof raw.id !== "string") throw new StudioError("Item ID required."); await deleteLibraryItem(await kindOf(context), raw.id); return jsonResponse({ success: true }); } catch (error) { return errorResponse(error); } });
