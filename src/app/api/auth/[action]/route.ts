import { authenticate, signIn, signOut } from "@/lib/auth";
import { errorResponse, jsonResponse, readInput, StudioError } from "@/lib/studio/http";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { return jsonResponse({ user: await authenticate(request) }); } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  try {
    const { action } = await params;
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    if (action === "logout") {
      await readInput(request); await signOut(request);
      return Response.json({ success: true }, { headers: { "set-cookie": `sparkle_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`, "Cache-Control": "no-store" } });
    }
    if (!["login", "register"].includes(action)) throw new StudioError("Auth action not found.", 404);
    const { token, user } = await signIn(await readInput(request), action === "register");
    return Response.json({ user }, { headers: { "set-cookie": `sparkle_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secure}`, "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
