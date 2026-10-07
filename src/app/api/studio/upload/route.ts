import { api } from "@/lib/auth";
import { storeMedia } from "@/lib/media";
import { jsonResponse, StudioError } from "@/lib/studio/http";
export const runtime = "nodejs";
export const POST = api(async (request: Request) => {
  const maximum = 21 * 1024 * 1024;
  if (Number(request.headers.get("content-length") || 0) > maximum) throw new StudioError("Choose a file smaller than 20 MB.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new StudioError("Choose a media file.");
  const chunks: Uint8Array[] = []; let size = 0;
  try { for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > maximum) { await reader.cancel(); throw new StudioError("Choose a file smaller than 20 MB.", 413); } chunks.push(value); } } finally { reader.releaseLock(); }
  let form: FormData;
  try { form = await new Response(Buffer.concat(chunks), { headers: { "content-type": request.headers.get("content-type") || "" } }).formData(); } catch { throw new StudioError("Expected a multipart media upload."); }
  const file = form.get("file");
  if (!(file instanceof File)) throw new StudioError("Choose a media file.");
  return jsonResponse(await storeMedia(file.name, file.type, Buffer.from(await file.arrayBuffer())), 201);
});
